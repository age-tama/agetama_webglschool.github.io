
// 必要なモジュールを読み込み
import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';

// DOM がパースされたことを検出するイベントを設定
window.addEventListener('DOMContentLoaded', () => {
  // 制御クラスのインスタンスを生成
  const app = new App3();
  // 初期化
  app.init();
  // 描画
  app.render();
}, false);

class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 90,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 3.0,
      y: 3.0,
      z: 3.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      // レンダラーが背景をリセットする際に使われる背景色
      clearColor: 0x112323,
      // レンダラーが描画する領域の横幅
      width: window.innerWidth,
      // レンダラーが描画する領域の縦幅
      height: window.innerHeight,
    };
  }

  /**
   * HemisphereLight定義のための定数
   */
    static get HEMISPHERE_LIGHT_PARAM() {
      return {
        color01: 0x507fff, // 光の色
        color02: 0xd0e040, // 光の色
        intensity: 0.8,  // 光の強度
        x: 2.0,          // 光の向きを表すベクトルの X 要素
        y: 2.0,          // 光の向きを表すベクトルの Y 要素
        z: 0.0           // 光の向きを表すベクトルの Z 要素
      };
    }

  // /**
  //  * ディレクショナルライト定義のための定数
  //  */
  //   static get DIRECTIONAL_LIGHT_PARAM() {
  //     return {
  //       color: 0xffffff, // 光の色
  //       intensity: 0.2,  // 光の強度
  //       x: 1.0,          // 光の向きを表すベクトルの X 要素
  //       y: 3.0,          // 光の向きを表すベクトルの Y 要素
  //       z: 1.0           // 光の向きを表すベクトルの Z 要素
  //     };
  //   }

  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.1,  // 光の強度
    };
  }

  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffaa, // マテリアルの基本色
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer;         // レンダラ
    this.scene;            // シーン
    this.camera;           // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight;     // アンビエントライト
    this.material;         // マテリアル
    this.torusGeometry;    // トーラスジオメトリ
    this.torusArray;       // トーラスメッシュの配列 
    this.controls;         // オービットコントロール
    this.axesHelper;       // 軸ヘルパー

    this.isDown = false; // キーの押下状態を保持するフラグ

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
    this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
    const wrapper = document.querySelector('#js-glbody');
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far,
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z,
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.hemisphereLight = new THREE.HemisphereLight(
      App3.HEMISPHERE_LIGHT_PARAM.color01,
      App3.HEMISPHERE_LIGHT_PARAM.color02,
      App3.HEMISPHERE_LIGHT_PARAM.intensity
    );
    this.hemisphereLight.position.set(
      App3.HEMISPHERE_LIGHT_PARAM.x,
      App3.HEMISPHERE_LIGHT_PARAM.y,
      App3.HEMISPHERE_LIGHT_PARAM.z,
    );
    this.scene.add(this.hemisphereLight);

    // // ディレクショナルライト（平行光源）
    // this.directionalLight = new THREE.DirectionalLight(
    //   App3.DIRECTIONAL_LIGHT_PARAM.color,
    //   App3.DIRECTIONAL_LIGHT_PARAM.intensity
    // );
    // this.directionalLight.position.set(
    //   App3.DIRECTIONAL_LIGHT_PARAM.x,
    //   App3.DIRECTIONAL_LIGHT_PARAM.y,
    //   App3.DIRECTIONAL_LIGHT_PARAM.z,
    // );
    // this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

    // 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する
    const BOX_COUNT = 300;
    const TRANSFORM_SCALE = 3.0;
    this.boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    this.boxArray = [];
    for(let i = 0; i < BOX_COUNT; ++i) {
      // ボックスメッシュのインスタンスを生成
      const box = new THREE.Mesh(this.boxGeometry, this.material);

      // 座標をランダムに
      box.position.x = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE * 2.0;
      box.position.y = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE *2.0;
      box.position.z = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE *2.0;

      box.rotation.set(Math.random() * 360, Math.random() * 360, Math.random() * 360);

      // シーンに追加する
      this.scene.add(box);
      // 配列に入れておく
      this.boxArray.push(box);
    }

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    this.boxArray.forEach((box) => {
      box.rotation.x += Math.random() * 0.01;
      box.rotation.y += Math.random() * 0.01;
      box.rotation.z += Math.random() * 0.01;
    });

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
