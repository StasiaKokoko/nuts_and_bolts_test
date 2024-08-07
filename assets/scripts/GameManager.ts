import { _decorator, Component, Node } from 'cc';
import { Detail } from './Detail';
import { SlotOrBolt } from './SlotOrBolt';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {    

    @property(Detail)
    details: Detail[] = [];

    private selectedBolt: SlotOrBolt = null;

    onLoad() {
        this.node.on('sob-clicked', this.onSoBClicked, this);
    }

    onDestroy() {
        this.node.off('sob-clicked', this.onSoBClicked, this);
    }

    private onSoBClicked(sob: SlotOrBolt) {
        console.log('onSoBClicked called with:', sob.node.name);
    
        if (this.selectedBolt) {
            if (!sob.isBolt()) {
                console.log('Swapping bolt and slot:', this.selectedBolt.node.name, sob.node.name);
                this.swapBoltSlot(this.selectedBolt, sob);
                this.selectedBolt = null;
            } else {
                console.log('Clicked on another bolt, deselecting:', this.selectedBolt.node.name);
                this.selectedBolt = null;
            }
        } else if (sob.isBolt()) {
            console.log('Bolt selected:', sob.node.name);
            this.selectedBolt = sob;
        } else {
            console.log('Clicked on an empty slot, no action');
        }
    }
    
    private swapBoltSlot(bolt: SlotOrBolt, slot: SlotOrBolt) {
        if (!bolt || !slot) {
            console.error('Bolt or Slot is null');
            return;
        }
        
        bolt.setFilled(false);
        slot.setFilled(true);
    
        this.checkWinCondition();  // Проверяем победу после смены болта
    }

    checkWinCondition() {
        const allDetailsFallen = this.details.every(detail => {
            const filledSoBs = detail.getComponents(SlotOrBolt).filter(sob => sob.isBolt());
            return filledSoBs.length === 0;
        });

        if (allDetailsFallen) {
            //console.log('You won!');
            // Здесь можно добавить логику завершения уровня
        }
    }
}