import { _decorator, Component, Node, RigidBody2D, WheelJoint2D, Vec2, Collider2D, ERigidBody2DType } from 'cc';
import { SlotOrBolt } from './SlotOrBolt';
const { ccclass, property } = _decorator;

@ccclass('Detail')
export class Detail extends Component {
    @property(SlotOrBolt)
    slotOrBolts: SlotOrBolt[] = [];

    private rigidBody: RigidBody2D = null;
    private wheelJoint: WheelJoint2D = null;

    onLoad() {
        this.rigidBody = this.getComponent(RigidBody2D);
    
        // Подписываемся на события изменения состояния от каждого SlotOrBolt
        this.slotOrBolts.forEach(sob => {
            if (sob) {
                sob.node.on('state-changed', this.updateDetailState, this);
            }
        });

        this.setStatic();
    }
    
    onDestroy() {
        // Удаляем подписку при уничтожении объекта
        this.node.scene.off('state-changed', this.updateDetailState, this);
    }
    
    private updateDetailState(sob: SlotOrBolt) {
        if (!sob || this.slotOrBolts.indexOf(sob) === -1) {
            console.log('ignore', sob ? sob.node.name : 'undefined sob');
            return;  // Игнорируем изменения, если SlotOrBolt не относится к этой детали или sob равен undefined
        }
    
        // Проверяем, является ли sob болтом и касается ли он детали
        if (sob.isBolt() && !this.areBoltsTouching()) {
            console.log(`Bolt ${sob.node.name} is not touching the detail, exiting method.`);
            return;  // Если болт не касается детали, выходим из метода
        }
    
        if (this.node.getPosition().y < -1000) {
            console.log('destroy');
            this.node.destroy();
            return;
        }
    
        const filledSoBs = this.slotOrBolts.filter(sob => sob && sob.isBolt());
        const filledCount = filledSoBs.length;
    
        // Логируем всю информацию
        console.log(`---------- Detail: ${this.node.name}`);
        console.log(`Total SoBs: ${this.slotOrBolts.length}`);
        console.log(`Filled SoBs: ${filledCount}`);
        console.log(`SoBs is touching: ${this.areBoltsTouching()}`);
        filledSoBs.forEach((sob, index) => {
            //console.log(`Filled SoB #${index + 1}: ${sob.node.name}`);
        });
    
        // Логика поведения детали в зависимости от количества заполненных SoBs
        if (filledCount >= 2 && this.areBoltsTouching()) {
            console.log('-- 1 --');
            this.setStatic();
        } else if (filledCount === 1 && this.areBoltsTouching()) {
            console.log('-- 2 --');
            this.setDynamic();
            this.attachJoint(filledSoBs[0]);
    
            // Переключаем Joint для обновления
            this.getComponent(WheelJoint2D).enabled = false;
            this.getComponent(WheelJoint2D).enabled = true;
        }
        
        if (!this.areBoltsTouching()) {
            console.log('-- 3 --');
            this.setDynamic();
            this.detachJoints();
        }
    }
    
    
    
    
    

    // Метод для ручной проверки соприкосновения коллайдеров
    private areBoltsTouching(): boolean {
        const detailCollider = this.getComponent(Collider2D);
        if (!detailCollider) {
            console.error('Detail has no Collider2D');
            return false;
        }

        for (let sob of this.slotOrBolts) {
            if (sob.isBolt()) {
                const boltCollider = sob.getComponent(Collider2D);
                if (boltCollider && this.isColliding(detailCollider, boltCollider)) {
                    return true; // Если хотя бы один болт касается детали, возвращаем true
                }
            }
        }

        return false; // Ни один из болтов не касается детали
    }

    // Метод для проверки пересечения двух коллайдеров
    private isColliding(colliderA: Collider2D, colliderB: Collider2D): boolean {
        const worldAABB = colliderA.worldAABB;
        const worldBABB = colliderB.worldAABB;
        
        return worldAABB.intersects(worldBABB);
    }

    private setStatic() {
        if (this.rigidBody) {
            this.rigidBody.type = ERigidBody2DType.Static;
            this.rigidBody.angularVelocity = 0;
            this.detachJoints();
        }
    }

    private setDynamic() {
        if (this.rigidBody) {
            this.rigidBody.angularVelocity = 1;
            this.rigidBody.type = ERigidBody2DType.Dynamic;
        }
    }

    public attachJoint(filledSoB: SlotOrBolt) {
        if (!this.rigidBody || !filledSoB) {
            console.error('Missing RigidBody2D on Detail or invalid SlotOrBolt');
            return;
        }
    
        const boltRigidBody = filledSoB.getComponent(RigidBody2D);
        if (!boltRigidBody) {
            console.error('Missing RigidBody2D on SlotOrBolt');
            return;
        }
    
        // Проверка и отключение существующего WheelJoint2D
        if (this.wheelJoint) {
            this.wheelJoint.enabled = false;
        } else {
            // Проверяем, есть ли уже WheelJoint2D на объекте
            this.wheelJoint = this.getComponent(WheelJoint2D);
            if (!this.wheelJoint) {
                this.wheelJoint = this.addComponent(WheelJoint2D);
            }
        }
    
        // Вычисляем якорь относительно координат объекта детали
        const boltWorldPos = filledSoB.node.getWorldPosition();
        const detailWorldPos = this.node.getWorldPosition();
        const localAnchor = boltWorldPos.subtract(detailWorldPos);
    
        // Настройка WheelJoint2D
        this.wheelJoint.connectedBody = boltRigidBody;
        this.wheelJoint.anchor = new Vec2(localAnchor.x, localAnchor.y);
        this.wheelJoint.connectedAnchor = Vec2.ZERO;
    
        // Включаем WheelJoint2D после полной настройки
        this.wheelJoint.enabled = true;
    
        console.log(`Attaching joint at anchor: (${localAnchor.x}, ${localAnchor.y})`);
    
        // Пробуждаем физические тела
        this.rigidBody.wakeUp();
        boltRigidBody.wakeUp();
    }
    

    public detachJoints() {
        if (this.wheelJoint) {
            this.wheelJoint.enabled = false;
            this.wheelJoint.connectedBody = null;
        }
    }
}
