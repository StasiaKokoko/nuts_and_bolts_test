import { _decorator, Component, Node, RigidBody2D, WheelJoint2D, Vec2, Collider2D, ERigidBody2DType, Rect, UITransform } from 'cc';
import { SlotOrBolt } from './SlotOrBolt';
const { ccclass, property } = _decorator;

@ccclass('Detail')
export class Detail extends Component {
    @property(SlotOrBolt)
    slotOrBolts: SlotOrBolt[] = [];

    private rigidBody: RigidBody2D = null;
    private wheelJoint: WheelJoint2D = null;

    @property(Boolean)
    private isFallen = false;

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
        if (this.isFallen === true) {
            return;
        }

        if (!sob || this.slotOrBolts.indexOf(sob) === -1) {
            console.log('ignore', sob ? sob.node.name : 'undefined sob');
            return;  // Игнорируем изменения, если SlotOrBolt не относится к этой детали или sob равен undefined
        }
    
        // Проверяем, является ли sob болтом и касается ли он детали
        if (sob.isBolt() && !this.areBoltsTouching()) {
            console.log(`Bolt ${sob.node.name} is not touching the detail, exiting method.`);
            return;  // Если болт не касается детали, выходим из метода
        }
    
        const filledSoBs = this.slotOrBolts.filter(sob => sob && sob.isBolt());
        const filledCount = filledSoBs.length;
        let filledSobsAreTouch = true;
    
        // Логируем всю информацию
        console.log(`---------- Detail: ${this.node.name}`);
        console.log(`Total SoBs: ${this.slotOrBolts.length}`);
        console.log(`Filled SoBs: ${filledCount}`);
    
        // Логика поведения детали в зависимости от количества заполненных SoBs
        if (filledCount >= 2 && this.allBoltsTouching()) {
            console.log('-- 1 --');
            this.setStatic();
        } else if (filledCount === 1 && this.allBoltsTouching()) {
            console.log('-- 2 --');
            this.setDynamic();
            this.attachJoint(filledSoBs[0]);
    
            // Переключаем Joint для обновления
            this.getComponent(WheelJoint2D).enabled = false;
            this.getComponent(WheelJoint2D).enabled = true;
        }
        
        if (!this.areBoltsTouching()) {
            console.log('-- 3 --');
            this.isFallen = true;
            this.setDynamic();
            this.detachJoints();
        }
    }
    
    
    private allBoltsTouching(): boolean {
        let answer = true;
        const filledSoBs = this.slotOrBolts.filter(sob => sob && sob.isBolt());
        filledSoBs.forEach((sob, index) => {
            answer = this.isColliding(sob.getComponent(Collider2D), this.getComponent(Collider2D));
            console.log(`Touch? ${sob.node.name} - `, answer);
            if (answer === false) {
                return false;
            }
        });
        return answer;
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

    // Метод для получения мирового BoundingBox узла
private getWorldBoundingBox(node: Node): Rect {
    const position = node.getWorldPosition();
    const scale = node.getWorldScale();
    const size = node.getComponent(UITransform).contentSize;

    // Учитываем масштаб
    const width = size.width * scale.x;
    const height = size.height * scale.y;

    // Создаем BoundingBox в мировых координатах
    return new Rect(
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
    );
}

// Метод для проверки пересечения двух узлов
private isColliding(colliderA: Collider2D, colliderB: Collider2D): boolean {
    const boxA = this.getWorldBoundingBox(colliderA.node);
    const boxB = this.getWorldBoundingBox(colliderB.node);

    const intersects = boxA.intersects(boxB);
    console.log(`Colliders intersect: ${intersects}`);
    return intersects;
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
