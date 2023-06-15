// modules
import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';

// 最初のHTML文書の読み込みと解析が完了したとき（DOMパース後）
// デフォルトでも第二引数はfalseらしく、ほぼすべてのイベントがバブリングで処理される。バブリングフェーズで処理（対象の要素=>親要素・祖先要素へとイベントが伝播）
window.addEventListener('DOMContentLoaded', () => {
  // 制御クラス（自家製）のインスタンスを生成
  const app = new App3();
  app.init();
  app.render();
});

// 制御クラス（自家製）の定義
// パラメータとか設定するとこみたいな。。
class App3 {
  // カメラ設定用パラメータ
  static get CAMERA_PARAM() {
    return {
      fovy: 60, // カメラの視野の角度
      aspect: window.innerWidth / window.innerHeight, // カメラの描画エリアのアスペクト比
      near: 0.1, // どこから
      far: 20.0, // どこまでの範囲で描画するか
      x: 0.0,
      y: 0.0,
      z: 12.0, // カメラを設置する場所の座標
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0), // カメラの注視点（向いている方向）
    };
  }

  // レンダラー設定用パラメータ
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xe6e6fa, // クリアする色？？
      width: window.innerWidth,
      height: window.innerHeight, // 描画する範囲のwidth, height
    };
  }

  // ディレクショナルライト（ex:太陽）設定用パラメータ
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0, // 光の強度
      x: 1.0,
      y: 1.0,
      z: 1.0, // 光の向き（どこに向かって伸びていくか）を表すベクトル座標
    };
  }

  //  アンビエントライト（環境光）設定用パラメータ
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.2, // 光の強度
    };
  }

  // マテリアル設定用パラメータ
  static get MATERIAL_GREEN_PARAM() {
    return {
      color: 0x2e8b57, // マテリアルの基本色
    };
  }
  static get MATERIAL_BROWN_PARAM() {
    return {
      color: 0x8b4513, // マテリアルの基本色
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer; // レンダラ
    this.scene; // シーン
    this.camera; // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight; // アンビエントライト
    this.greenMaterial; // 緑のマテリアル
    this.fanGeometry; // 扇風機の羽用ジオメトリ
    this.fanArray; // 扇風機の羽用ジオメトリの配列
    this.fanGroup; // 扇風機の羽用グループ
    this.fansGroup; // 扇風機の羽用グループ
    this.pillarGeometry; // 支柱用のジオメトリ
    this.neckGeometry; // 首振り付け根用のジオメトリ
    this.neckGroup; // 首振り付け根用グループ
    this.fanneckGroup; // 首とファン用グループ
    this.fanneckAngle; // 首とファン用の角度
    this.controls; // オービットコントロール ###002 カメラコントロール
    this.axesHelper; // 軸ヘルパー

    // 再起呼び出しのための this 固定（バインドする）
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight); // レンダラの大きさを設定
      this.camera.aspect = window.innerWidth / window.innerHeight; // カメラが撮影する範囲のアスペクト比を設定
      this.camera.updateProjectionMatrix(); // カメラのパラメータが変更されたときは行列を更新する
    });
  };

  // 初期化
  init() {
    // レンダラーの初期化（スクリーンに映す）
    this.renderer = new THREE.WebGLRenderer(); 
    this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor)); // 色
    this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height); // 描画サイズ
    const wrapper = document.querySelector('#js-glbody');
    wrapper.appendChild(this.renderer.domElement); // 出力内容を描画するキャンバスをwrapper内に追加

    // シーンの初期化（描画する3D空間全体の情報をまとめて持っている）
    // ここに光やメッシュなど、描画するものを追加していく
    this.scene = new THREE.Scene();

    // カメラの初期化
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy, // カメラの視野の角度
      App3.CAMERA_PARAM.aspect, // カメラの描画エリアのアスペクト比
      App3.CAMERA_PARAM.near, // どこから
      App3.CAMERA_PARAM.far, // どこまでの範囲で描画するか
    );
    this.camera.position.set(
      // カメラを設置する場所の座標
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z,
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt); // カメラの注視点（向いている方向 

    // ディレクショナルライト（太陽光）の初期化
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color, // 光の色
      App3.DIRECTIONAL_LIGHT_PARAM.intensity, // 光の強さ
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x, 
      App3.DIRECTIONAL_LIGHT_PARAM.y, 
      App3.DIRECTIONAL_LIGHT_PARAM.z, // 光の向き（どこに向かって伸びていくか）を表すベクトル座標
    );
    this.scene.add(this.directionalLight);

    //  アンビエントライトの初期化
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,  // 光の色
      App3.AMBIENT_LIGHT_PARAM.intensity, // 光の強さ
    );
    this.scene.add(this.ambientLight);

    // マテリアル（色や質感）の初期化
    // 緑
    this.greenMaterial = new THREE.MeshPhongMaterial(
      App3.MATERIAL_GREEN_PARAM,  // ???なぜキーを取らないのか？
    );
    // 茶色
    this.brownMaterial = new THREE.MeshPhongMaterial(
      App3.MATERIAL_BROWN_PARAM,  // ???なぜキーを取らないのか？
    );


    // グループの作成
    // グループの中身は後でaddする
    this.fansGroup = new THREE.Group();
    this.fanneckGroup = new THREE.Group();
    this.scene.add(this.fanneckGroup);
    
    // メッシュの生成
    // 02: 扇風機の羽（合計）の設定
    const FANS_COUNT = 12; // 羽の合計の数
    
    // 01: 扇風機の羽（1枚）の設定
    const FAN_COUNT = 5; // 1枚の羽根に入るスフィアの数
    var fan_radius = 0.1; // スフィアの半径
    var fan_position_x = 0;
    var fan_position_y = 0.5;
    var fan_position_z = 0;
    
    this.fanArray = [];
    
    // 02: 扇風機の羽（合計）
    for(let i = 0; i < FANS_COUNT; i++) {
      this.fanGroup = new THREE.Group(); // FANS_COUNT の数の分だけnewしないとだめ？？グループ化しないとだめ？

      // 01: 扇風機の羽（1枚）
      for(let j = 0; j < FAN_COUNT; ++j) {
        this.fanGeometry = new THREE.SphereGeometry(
          fan_radius, // スフィアの半径
          32, // スフィアの横？何分割して疑似的に球に見せるか？
          16, // スフィアの縦？何分割して疑似的に球に見せるか？
        );
  
        // 1枚の羽用メッシュのインスタンスを生成
        const fan = new THREE.Mesh(this.fanGeometry, this.greenMaterial);
        fan.position.x = fan_position_x;
        fan.position.y = fan_position_y;
        fan.position.z = fan_position_z;
  
        // グループに追加
        this.fanGroup.add(fan);
        this.fanArray.push(fan);
  
        // 次ループに向けて変数の更新
        fan_radius = fan_radius + 0.025 * j; // スフィアの半径を更新
        // fan_position_x = fan_position_x * (i + 2);
        fan_position_y = fan_position_y + 0.5 + 0.05 * j * j;

        if(j + 1 == FAN_COUNT) {
          fan_radius = 0.1;
          fan_position_y = 0.5;
        }
      }

      this.fanGroup.rotation.z = 360 / FANS_COUNT * Math.PI * i / 180;
      this.fansGroup.add(this.fanGroup);
      this.fanneckGroup.add(this.fansGroup);
      this.scene.add(this.fanneckGroup);
      // this.scene.add(this.fansGroup);
    }
    
    this.fansGroup.translateY(2.5); // 羽全体を上に上げる
    this.fansGroup.translateZ(0.5); // 羽全体を前面に

    // 支柱用のジオメトリを生成
    this.pillarGeometry = new THREE.CylinderGeometry(
      0.08, // 上面のradius
      0.5, // 底面のradius
      5.0, // 高さ
      40, // 何角錐にするか
    );
    const pillar = new THREE.Mesh(this.pillarGeometry, this.brownMaterial);
    // pillar.translateY(-3.0);
    this.scene.add(pillar);

    // 首振り付け根用のジオメトリ
    this.neckGroup = new THREE.Group();
    this.neckGeometry = new THREE.CylinderGeometry(
      0.08,
      0.08,
      1.0,
      40,
    );
    const neck = new THREE.Mesh(this.neckGeometry, this.brownMaterial);
    // pillar.translateY(-3.0);
    neck.position.set(0.0, 0.5, -2.42);
    this.neckGroup.add(neck);
    this.neckGroup.rotation.x = 90 * Math.PI / 180;
    this.fanneckGroup.add(this.neckGroup);

    // 首振り扇風機のスイング角度初期値
    this.fanneckAngle = 0.00;

    // カメラコントロールの初期化
    // 第2引数に、イベントを検出する対象となるDOM(canvas)を渡す
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

  }
  
  // 描画処理
  // render()は、スクリーン更新のタイミング：ディスプレイのリフレッシュレート(60fps)で呼び出される
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);
    
    // オービットコントロールの更新
    this.controls.update();
    
    // 扇風機の回転
    this.fansGroup.rotation.z -= 0.02;

    // 扇風機の首振り
    if( 0.00 < this.fanneckAngle < 1.00 ) {
      this.fanneckGroup.rotation.y += 0.01 * ( this.fanneckAngle + 0.01);
      this.fanneckAngle = this.fanneckAngle + 0.01;
    } 

    // レンダラーで描画
    // 対象のシーンと、どのカメラで映し出すかを指定
    this.renderer.render(this.scene, this.camera);
  }

}