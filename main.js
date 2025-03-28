import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DeviceOrientationControls } from './libs/DeviceOrientationControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('click', onClick);
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
const texture360 = new THREE.TextureLoader().load('./FieldWithClouds.png');
texture360.colorSpace = THREE.SRGBColorSpace; 
const material360 = new THREE.MeshBasicMaterial({ map: texture360 });
const mesh360 = new THREE.Mesh(background360Geometry, material360);
scene.add(mesh360);

// === Загрузка 3D-модели ===
const loader = new GLTFLoader();
loader.load(
	'./scene.glb',
	function (gltf) {
		scene.add(gltf.scene);
		// Добавляем все объекты модели в массив для проверки пересечений
		gltf.scene.traverse(function (child) {
			if (child instanceof THREE.Mesh) {
                if (child.name == "Mars" || child.name == "Moon") {
                    triggersForObject.push(child);
                    console.log('Trigger addings:' + child.name);
                }
			}
		});

        // Если в файле есть анимации
        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            animationClips.push(...gltf.animations);
            mixer.clipAction(animationClips[0]).play();
            mixer.clipAction(animationClips[1]).play();
            mixer.clipAction(animationClips[2]).play();
        }

        // Как только страница загружена, начинаем плавное появление сцены
        setTimeout(() => {
            fade.style.opacity = 1; // Прозрачность исчезает
            setTimeout(() => {
                fade.style.opacity = 0; // Сцена становится видимой
            }, 100); // Плавное появление через короткую задержку
        }, 1000);  // Немного подождать, чтобы затемнение исчезло


	},	
	function (xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},	
	function (error) {
		console.log('An error happened:' + error);
	} 
);

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

function onClick(event) {
    if (triggersForObject.length === 0) return;

    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(triggersForObject);

    if (intersects.length > 0) { 
        const object = intersects[0].object;
        console.log('TriggerPress: ' + object.name);
        if (object.name == "Mars") { 
            fade.style.opacity = 1;
            setTimeout(() => {window.location.href = 'Mars.html';}, 1000);
        }

        if (object.name == "Moon") { 
            fade.style.opacity = 1;
            setTimeout(() => {window.location.href = 'Moon.html';}, 1000);
        }
    }
}

window.addEventListener('unload', () => {
    texture360.dispose();
});