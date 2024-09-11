import './index.css';
import { TokenDto } from './main/token-service/types';

document.addEventListener('DOMContentLoaded', async () => {
    const version = document.querySelector('#version');
    version.innerHTML = await window.infos.currentVersion();

    const tokensTable = document.getElementById('tokensTable') as HTMLTableElement;
    const tokensTbody = tokensTable.tBodies[0];
    const templateTrToken = document.getElementById('templateTrToken') as HTMLTemplateElement;
    const tokens = await window.forms.getTokens();
    for (const token of tokens) {
        const newTr = document.importNode(templateTrToken.content, true);
        newTr.querySelector<HTMLTableCellElement>('.token').innerText = token.token;
        newTr.querySelector<HTMLTableCellElement>('.nickname').innerText = token.nickname;
        newTr.querySelector<HTMLButtonElement>('.removeToken').dataset.id = token.uuid;
        tokensTbody.appendChild(newTr);
    }

    const addNewToken = document.getElementById('addNewToken') as HTMLFormElement;
    addNewToken.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(addNewToken);
        const novoTokenDto = Object.fromEntries(formData) as TokenDto;

        const response = await window.forms.newToken(novoTokenDto);
        if (response.error) {
            await window.infos.showDialog({
                type: 'error',
                title: 'Erro',
                message: response.error,
            });
            return;
        }

        window.location.reload();
    });

    async function removeToken(element: HTMLElement) {
        const uuid = element.dataset.id;
        const response = await window.forms.removeToken(uuid);
        if (response?.error) {
            await window.infos.showDialog({
                type: 'error',
                title: 'Erro',
                message: response.error,
            });
            return;
        }

        window.location.reload();
    }

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('removeToken')) {
            removeToken(target);
            return;
        }
    });
});
