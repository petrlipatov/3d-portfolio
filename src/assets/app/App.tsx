import { Canvas } from "@react-three/fiber";
import { OrbitControls, Loader } from "@react-three/drei";
import * as THREE from "three";
import s from "./app.module.css";
import { useLoader } from "@react-three/fiber";
import { useEffect } from "react";
import { Suspense } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router";
import { useSpring, animated, config, useSprings } from "@react-spring/three";

const images = [
  { lowres: "/previews/1.jpeg", hires: "/images/1.jpeg" },
  { lowres: "/previews/2.jpeg", hires: "/images/2.jpeg" },
  { lowres: "/previews/3.jpeg", hires: "/images/3.jpeg" },
  { lowres: "/previews/4.jpeg", hires: "/images/4.jpeg" },
  { lowres: "/previews/5.jpeg", hires: "/images/5.jpeg" },
  { lowres: "/previews/6.jpeg", hires: "/images/6.jpeg" },
  { lowres: "/previews/7.jpeg", hires: "/images/7.jpeg" },
  { lowres: "/previews/8.jpeg", hires: "/images/8.jpeg" },
  { lowres: "/previews/9.jpeg", hires: "/images/9.jpeg" },
  { lowres: "/previews/10.jpeg", hires: "/images/10.jpeg" },
  { lowres: "/previews/11.jpeg", hires: "/images/11.jpeg" },
  { lowres: "/previews/12.jpeg", hires: "/images/12.jpeg" },
  { lowres: "/previews/13.jpeg", hires: "/images/13.jpeg" },
  { lowres: "/previews/14.jpeg", hires: "/images/14.jpeg" },
  { lowres: "/previews/15.jpeg", hires: "/images/15.jpeg" },
  { lowres: "/previews/16.jpeg", hires: "/images/16.jpeg" },
  { lowres: "/previews/17.jpeg", hires: "/images/17.jpeg" },
  { lowres: "/previews/18.jpeg", hires: "/images/18.jpeg" },
];

function Popup({ image, onClose }) {
  return createPortal(
    <div className={s.popup} onClick={onClose}>
      <div className={s.popupContent}>
        <LazyLoadedImage src={image} alt="Selected" />
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

function LazyLoadedImage({ src, alt }) {
  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoadedSrc(src);
  }, [src]);

  if (!loadedSrc) {
    return <div className={s.loader}>Загрузка изображения...</div>;
  }

  return <img src={loadedSrc} alt={alt} className={s.image} />;
}

function ImagePlane({ data, position, onClick }) {
  const texture = useLoader(THREE.TextureLoader, data.lowres) as THREE.Texture;
  const [active, setActive] = useState(false);

  const { scale } = useSpring({
    scale: active ? 1.2 : 1,
    config: config.wobbly,
  });

  return (
    <animated.mesh
      position={position}
      rotation={[0, 0, 0]}
      scale={scale}
      onClick={(e) => {
        onClick(data.hires);
        e.stopPropagation();
      }}
      onPointerOver={() => setActive(!active)}
      onPointerOut={() => setActive(!active)}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </animated.mesh>
  );
}

const positionsRandom = Array.from({ length: 200 }, () => {
  const spacing = 1.5;

  const angle = Math.random() * Math.PI * 2;
  const radiusX = spacing * 20;
  const radiusY = spacing * 20;

  return [
    Math.cos(angle) * radiusX * Math.random(),
    Math.sin(angle) * radiusY * Math.random(),
    Math.random() * 10,
  ];
});

const generateGridPositions = (totalItems, spacing = 1.5) => {
  // Вычисляем количество строк и столбцов, чтобы сетка была квадратной
  const cols = Math.ceil(Math.sqrt(totalItems));
  const rows = Math.ceil(totalItems / cols);

  // Рассчитываем смещение, чтобы сетка была по центру
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetY = ((rows - 1) * spacing) / 2;

  const positions = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (positions.length >= totalItems) return positions;

      const x = col * spacing - offsetX;
      const y = row * spacing - offsetY;

      positions.push([x, y, 0]); // Все элементы будут располагаться в плоскости Z=0
    }
  }

  return positions;
};

const positionsGrid = generateGridPositions(200);

const CloudOfImages = ({ reversed, onClick }) => {
  const springs = useSprings(
    positionsRandom.length,
    positionsRandom.map((pos, index) => ({
      position: reversed ? positionsGrid[index] : pos, // Если reversed, анимация идет к начальной позиции
      config: {
        duration: 1000 + Math.min(Math.random() * 1000, 2000),
      },
      from: {
        position: reversed ? positionsRandom[index] : positionsGrid[index],
      },
      to: { position: reversed ? positionsGrid[index] : pos }, // Конечная позиция зависит от реверса
    }))
  );
  return (
    <>
      {springs.map((spring, index) => {
        const image = images[index % images.length];
        return (
          <ImagePlane
            key={index + "image"}
            data={image}
            onClick={onClick}
            position={spring.position}
          />
        );
      })}
    </>
  );
};

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reversed, setReversed] = useState(false); // Состояние для реверса

  const image = searchParams.get("image");

  const openImage = (image) => setSearchParams({ image });
  const closeImage = () => setSearchParams({});

  const toggleReverse = () => {
    setReversed(!reversed);
  };

  return (
    <div id="canvas-container" className={s.canvasContainer}>
      {image && <Popup image={image} onClose={closeImage} />}
      <button onClick={toggleReverse}>Тоглить анимацию</button>
      <Canvas camera={{ fov: 75, position: [0, 0, 20] }}>
        <Suspense fallback={null}>
          <CloudOfImages onClick={openImage} reversed={reversed} />
        </Suspense>

        <OrbitControls
          enableDamping
          enablePan
          zoomToCursor
          enableRotate={false}
          minDistance={-20}
          maxDistance={40}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
          }}
        />
      </Canvas>
      <Loader />
    </div>
  );
}

export default App;
