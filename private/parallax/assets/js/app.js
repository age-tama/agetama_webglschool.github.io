var $window = $(window),
  $html = $("html"),
  $body = $("#l-body"),
  $wrapper = $("#l-wrapper"),
  $header = $("#l-header"),
  $footer = $("#l-footer"),
  $main = $("#l-main"),
  $menu = $("#js-menu"),
  _windowWidth = 0,
  _windowHeight = 0,
  _isSp = false,
  _isTablet = false;
/*=====< utility >=====================================================================================**/
var Utility = {
  pageScroll: function () {
    var $hashhref_start = $('a[href^="#"]'),
      $hashhref_include = $('a[href*="#"]');
    
    // ページ内スクロール
    $hashhref_start.each(function (index, el) {
      // #から始まるリンク
      var $start = $(el);
      // リサイズでも走るのでフラグで判断する
      if (!$start.hasClass("is-hashonclick")) {
        // クリック
        $start.on("click", function (event) {
          event.preventDefault();
          var $this = $(event.currentTarget);
          // スムーススクロール実行
          smoothScroll($this);
        });
        // リサイズでも走るのでフラグ追加
        $start.addClass("is-hashonclick");
      }
    });
    // URLにハッシュタグがついている場合（Pjax遷移後にページ内リンクする場合）
    $hashhref_include.each(function (index, el) {
      // #が含まれているリンク(同一ページでも#から始まらない場合があるため)
      var $include = $(el);
      // リサイズでも走るのでフラグで判断する
      if (!$include.hasClass("is-hashonclick")) {
        // クリック
        $include.on("click", function (event) {
          //#を含むリンクは、リンク先と現在のページのURLを比較して判断
          var $this = $(event.currentTarget);
          // 現在のページのURL(絶対パスのハッシュ除く)
          var current_pathname = location.pathname;
          // リンク先のURL(絶対パスのハッシュ除く)
          var href = absolutePath($this.attr("href"));
          //ページ名が同じならスクロール移動
          if (href == current_pathname) {
            event.preventDefault();
            smoothScroll($this);
          }
        });
        // リサイズでも走るのでフラグ追加
        $include.addClass("is-hashonclick");
      }
    });

    // 相対パスから絶対パス取得
    var absolutePath = function(path) {
      // ※IEは下記URL関数に対応してないので変える
      if ($html.hasClass("bw-ie")) {
        var baseUrl = location.href;
        var url = new URL(path, baseUrl);
        return url.pathname;
      } else {
        var e = document.createElement("span");
        e.insertAdjacentHTML("beforeend", '<a href="' + path + '" />');
        return e.firstChild.pathname;
      }
    };

    // スムーススクロールメイン関数
    var smoothScroll = function (target) {
      setTimeout(() => {
        var href = target.attr("href");
        var target_url = href.split("#");
        var $target_el = $("#" + target_url[1]);
        var target_url_top = $target_el.offset().top;
        var offset_position = parseInt(target.attr("data-position"));
        if (offset_position) {
          target_url_top += offset_position;
        }
        gsap.to($window, {
          duration: 0.6,
          ease: "power4.inOut",
          scrollTo: {
            y: target_url_top,
            autoKill: false,
          },
        });
      }, delay_time);
    };
  },
  isPc: function () {
    if (matchMedia("(max-width: 1024px)").matches) {
      return false;
    } else {
      return true;
    }
  },
  letterSetting: function ($target) {
    // span付ける
    var result;
    $target.contents().each(function (index, el) {
      var $this = $(el);
      if (el.nodeType == 3) {
        result = $this.text().replace(/(\S)/g, "<span>$1</span>");
        result = result.replace(/(\s)/g, "<span>&nbsp;</span>");
      }
    });
    $target.html(result);
  },
  setBg: function ($target) {
    var bgsrc = $target.getAttribute("data-background-image");
    var bgimageset = $target.getAttribute("data-background-image-set");

    if(bgsrc) {
      // 普通の背景画像
      $target.style.backgroundImage = 'url("' + bgsrc + '")';
    }
    if(bgimageset) {
      // image-setで指定した背景画像(この場合、data-background-image-setには「url('a.jpg') 1x, url('b.jpg') 2x」のような形で入力されていることを想定)

      // 2倍の画像だけ取り出す
      var bg2x = bgimageset.split( ',' )[1].trim().slice( 0, -3 );
      // sytleとかだと無理なので直接属性をいじる
      $target.setAttribute('style', 'background-image: ' + bg2x + '; background-image: -webkit-image-set(' + bgimageset + '); background-image: image-set(' + bgimageset + ')');
    }
    // 読み込んだ
    $target.setAttribute("data-loaded", "true");
  },
};

/*=====< Fnc >=========================================================================================**/
var Fnc = {
  // 無限パララックススライダー
  parallaxLoop: function () {
    const items = document.querySelectorAll('.js-parallaxslider__item');

    const options = {
      root: null,
      rootMargin: '0%',
      threshold: [0], // 少しでも画面内に入ったら監視スタート
    }
    
    const callback = (entries, observe) => {
      
      entries.forEach((entry, index) => {
        let requestID;
        if(entry.isIntersecting) {
          // 要素が画面に入った時の処理

          entry.target.style.setProperty("--position", 0);

          const getPosition = () => {
            // 要素のpositionをパーセントで算出

            const windowWidth = window.innerWidth; // 画面幅
            const posX = entry.target.getBoundingClientRect().x; // 要素と画面左端との距離
            const itemWidth = entry.target.getBoundingClientRect().width;
            const itemRight = posX + itemWidth;
            let percent = (itemRight / (windowWidth + itemWidth)) * 100;
            // const percent = 100 - ((posX + itemWidth) / windowWidth) * 100;

            percent = Math.min(100, percent);
            percent = Math.max(0, percent);
            
            entry.target.style.setProperty("--position", percent);

            requestID = requestAnimationFrame(getPosition); // 1フレームごとに1描画させる
            
            if(percent >= 100 || percent < 0) {
              cancelAnimationFrame(requestID); // positionが100%を超えた場合にアニメーションを停止
            }
          }

          // 要素のpositionをパーセントで算出
          getPosition();

          entry.target.classList.add('is-active');

        } else {
          // 要素が画面から出た時の処理
          entry.target.classList.remove('is-active');

          entry.target.style.setProperty("--position", 0);
          cancelAnimationFrame(requestID);
        }
      });
    }

    const io = new IntersectionObserver(callback, options);

    items.forEach((elem) => {
      io.observe(elem);
    });

  }
};
/*=====< Pages >=========================================================================================**/
var Pages = {
  init: function () {
    var parser = new UAParser(),
      result = parser.getResult(),
      deviceType = result.device.type,
      os = "os-" + result.os.name.toLowerCase(),
      browser = "bw-" + result.browser.name.toLowerCase();
    // device
    if (deviceType == "mobile") {
      _isSp = true;
    }
    if (deviceType == "tablet") {
      _isTablet = true;
    }
    if (_isSp) {
      $html.addClass("is-sp");
    } else if (_isTablet) {
      $html.addClass("is-tab");
    } else {
      $html.addClass("is-pc");
    }
    // os
    $html.addClass(os);
    // browser
    $html.addClass(browser);

    // window幅・高さを保持
    _windowWidth = $window.width();
    _windowHeight = $window.height();

    // relopener
    // ページにあるa要素から「target=_blank」が設定された要素を取得
    var a_elements = document.querySelectorAll("a[target=_blank]");
    for (var i = 0; i < a_elements.length; i++) {
      // rel属性を設定
      a_elements[i].setAttribute("rel", "noopener");
      a_elements[i].setAttribute("rel", "noreferrer");
    }
  },
  animateblock: function () {
    // スクロールアニメーション
    var option = {
      onEnter: function onEnter(batch) {
        return gsap.fromTo(
          batch,
          {
            y: 20,
          },
          {
            duration: 1,
            ease: "power3.inout",
            autoAlpha: 1,
            y: 0,
          }
        );
      },
      start: "40% 100%",
      once: true,
    };
    ScrollTrigger.batch(".js-animateblock", option);
  },
  // ページロード時に実行
  on: function (isLoad) {
    // ページスクロール
    Utility.pageScroll();

    if (isLoad) {
      // 文字にspan
      $(".js-lt").each(function (index, el) {
        var $this = $(el);
        Utility.letterSetting($this);
      });
    } 

    if (!isLoad) {
      // リサイズ時はonloadを直接呼ぶ
      Pages.onload(false);
    }

    // 独自の処理
    Origin.on(isLoad);
  },
  imagesload() {
    var load_container = document.querySelectorAll('.js-imgloadcontainer');
    var imgLoad = imagesLoaded(load_container);
    try {
      imgLoad.on( 'done', (instance )=> {
        // 指定したエリア内の画像を読み込んだ
        if ($body.attr("data-loaded") == "false") {
          console.log("image loaded");
          // ここでonload発火(ここで上手くいかない場合は window load で発火する)
          $body.attr("data-loaded", "true");
          Pages.onload(true);
        }
      });
    } catch (error) {
      console.log('imageLoaded error: ' + error);
      $body.attr("data-loaded", "true");
      Pages.onload(true);
    }
  },
  onload: function (isLoad) {
    if (isLoad) {
      // スクロールアニメーション
      Pages.animateblock();
    }
    // 独自の処理
    Origin.onload(isLoad);
  },
};

// 独自の処理
var Origin = {
  on: function (isLoad) {
    if (isLoad) {
    }
  },
  onload: function (isLoad) {
    if (isLoad) {
      // 無限パララックススライダー
      Fnc.parallaxLoop();
    }
  },
};

/*=====< window event >=================================================================================**/
$window
  .on("load", function (event) {
    // 読み込みがまだだったら読み込む
    setTimeout(function () {
      if ($body.attr("data-loaded") == "false") {
        console.log("window load");
        $body.attr("data-loaded", "true");
        Pages.onload(true);
      }
    }, 300);
  })
  .on("resize", function (event) {
    // 幅が変わったか
    if (_windowWidth != $window.width()) {
      // 幅が変わったらリサイズ処理
      Pages.on(false);
    } else {
      if (Utility.isPc()) {
        if (_windowHeight != $window.height()) {
          // PCの場合は高さだけが変わった場合のみリサイズ処理
          Pages.on(false);
        }
      }
    }
    // 現在の幅と高さを保持
    _windowWidth = $window.width();
    _windowHeight = $window.height();
  })
  .on("scroll", function (event) {
    var st = $window.scrollTop(),
      skBtm = $window.height() + st;
  });

/*=====< start >========================================================================================**/
Pages.init();
Pages.on(true);
Pages.imagesload();
