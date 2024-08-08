import { _decorator, Component, Label } from 'cc';
import WebApp from "@twa-dev/sdk";

const { ccclass, property } = _decorator;

@ccclass('TelegramUserDisplay')
export class TelegramUserDisplay extends Component {
    @property(Label)
    userLabel: Label = null;

    onLoad() {
        // Проверка на наличие initDataUnsafe и данных пользователя
        const initData = WebApp.initDataUnsafe;
        const user = initData?.user;

        // Если игра запущена вне Telegram, использовать значения по умолчанию
        const username = user?.username || `${user?.first_name || 'Гость'} ${user?.last_name || ''}`;

        // Выводим имя пользователя на экран
        if (this.userLabel) {
            this.userLabel.string = `Привет, ${username.trim()}!`;
        }
    }
}
