/**
 * Controle do Menu Drawer
 * Gerencia abertura, fechamento e interações do menu lateral
 */

const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const menuToggle = document.getElementById('menuToggle');
const drawerClose = document.getElementById('drawerClose');
const drawerLinks = document.querySelectorAll('.drawer-menu a');

/**
 * Abrir o drawer
 */
function openDrawer() {
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
}

/**
 * Fechar o drawer
 */
function closeDrawer() {
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
}

/**
 * Toggle do drawer (abrir/fechar)
 */
function toggleDrawer() {
    drawer.classList.toggle('active');
    drawerOverlay.classList.toggle('active');
}

/**
 * Event Listeners
 */
menuToggle.addEventListener('click', toggleDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

/**
 * Fechar drawer ao clicar em um link
 */
drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
        closeDrawer();
    });
});

/**
 * Fechar drawer ao pressionar ESC
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
        closeDrawer();
    }
});

/**
 * Fechar drawer em mobile quando redimensionar
 */
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && drawer.classList.contains('active')) {
        closeDrawer();
    }
});

console.log('✅ Drawer menu carregado com sucesso');
