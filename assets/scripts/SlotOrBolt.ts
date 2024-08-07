import { _decorator, Component, Node, Sprite, SpriteFrame, Button } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('SlotOrBolt')
export class SlotOrBolt extends Component {
    @property(SpriteFrame)
    boltSprite: SpriteFrame = null;

    @property(SpriteFrame)
    slotSprite: SpriteFrame = null;

    @property
    public isFilled: boolean = false;

    @property(Button)
    private button: Button = null;

    onLoad() {
        this.updateSprite();

        if (this.button) {
            this.button.node.on(Button.EventType.CLICK, this.onClicked, this);
        } else {
            console.error('Button component not found on SlotOrBolt');
        }
    }

    private onClicked() {
        console.log('SlotOrBolt clicked:', this.node.name);
        if (this.node && this.node.scene) {
            const gameManager = this.node.scene.getComponentInChildren(GameManager);
            if (gameManager && gameManager.node) {
                gameManager.node.emit('sob-clicked', this);  // Сообщаем GameManager о клике
            } else {
                console.error('GameManager not found in the scene');
            }
        } else {
            console.error('Node or scene is null');
        }
    }

    setFilled(filled: boolean) {
        this.isFilled = filled;
        this.updateSprite();
     
        if (filled == false) {
        this.node.emit('state-changed', this);  // Сообщаем об изменении состояния всем подписчикам
        }
    }
    
    

    isBolt(): boolean {
        return this.isFilled;
    }

    public updateSprite() {
        const sprite = this.getComponent(Sprite);
        sprite.spriteFrame = this.isFilled ? this.boltSprite : this.slotSprite;
    }
}
