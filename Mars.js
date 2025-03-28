import * as THREE from 'three';
import { DeviceOrientationControls } from './libs/DeviceOrientationControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const triggersForObject = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); 
let mixer; // Контроллер анимации
const animationClips = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// === 360° фон ===
const background360Geometry = new THREE.SphereGeometry(500, 60, 40);
background360Geometry.scale(-1, 1, 1); 
const texture360 = new THREE.TextureLoader().load('./Mars.png');
texture360.colorSpace = THREE.SRGBColorSpace; 
const material360 = new THREE.MeshBasicMaterial({ map: texture360 });
const mesh360 = new THREE.Mesh(background360Geometry, material360);
scene.add(mesh360);

setTimeout(() => {
    fade.style.opacity = 1;
    setTimeout(() => {
        fade.style.opacity = 0;
    }, 100);
}, 1000);

const light = new THREE.AmbientLight(0xffffff, 5);
scene.add(light);

let controls;

// === Определение устройства ===
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
    // Проверяем наличие гироскопа на Android
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // Для iOS и Android с возможностью запроса разрешений
        function checkGyro() {
            let gyroEnabled = false;
    
            function onGyroData(event) {
                if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
                    gyroEnabled = true;
                    window.removeEventListener("deviceorientation", onGyroData);
                    initializeGyroControls();  // Гироскоп включен
                }
            }
    
            window.addEventListener("deviceorientation", onGyroData);
    
            setTimeout(() => {
                if (!gyroEnabled) {
                    showGyroButton();  // Если гироскоп не доступен
                }
            }, 1000); // Проверяем наличие данных через 1 секунду
        }

        // Показываем кнопку для разрешения гироскопа
        function showGyroButton() {
            let btn = document.createElement("button");
            btn.innerText = "Разрешить гироскоп";
            btn.style.position = "fixed";
            btn.style.top = "50%";
            btn.style.left = "50%";
            btn.style.transform = "translate(-50%, -50%)";
            btn.style.width = "45vw";
            btn.style.maxWidth = "400px";
            btn.style.minWidth = "200px";
            btn.style.padding = "15px";
            btn.style.fontSize = "18px";
            btn.style.background = "#007bff";
            btn.style.color = "#fff";
            btn.style.border = "none";
            btn.style.borderRadius = "10px";
            btn.style.cursor = "pointer";
            btn.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
            btn.style.textAlign = "center";

            btn.onclick = function () {
                DeviceMotionEvent.requestPermission().then(permissionState => {
                    if (permissionState === "granted") {
                        location.reload();  // Перезагрузка страницы, чтобы активировать гироскоп
                    }
                }).catch(console.error);
            };

            document.body.appendChild(btn);
        }

        checkGyro();
    } else {
        // Включаем гироскоп для Android с доступом
        initializeGyroControls();
    }
} else {
    // Управление с мышью для ПК
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1.0;
    controls.maxDistance = 1.0;
    controls.enableZoom = false;
    controls.target.set(0, 10, 0);
    controls.update();
}

// Инициализация гироскопического контроля
function initializeGyroControls() {
    camera.position.set(0, 10, 0);
    controls = new DeviceOrientationControls(camera);
    window.addEventListener("deviceorientation", handleOrientation);
}

const clock = new THREE.Clock();
function animate() {
    if (controls) { controls.update(); }
    if (mixer) { mixer.update(clock.getDelta()); }
    renderer.render(scene, camera);
}

function handleOrientation(event) {
    if (controls) {
        controls.update(event.alpha, event.beta, event.gamma);  // Обновляем данные гироскопа
    }
}

window.addEventListener('unload', () => {
    texture360.dispose();
});