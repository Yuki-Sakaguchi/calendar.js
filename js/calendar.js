/* TODO
    - スケジュールを追加
    - htmlの調整。もっと簡単に
    - modal機能
*/

/**
 * カレンダークラス
 * @param {*} options 
 */
var Calendar = function(options) {
    // デフォルトの設定
    this.options = {
        el: "#calendar",
        date: new Date(),
        schedule: null,
        paging: true,
        anime: 'fade',
        animeSpeed: 200,
        modal: false,
    };

    // 引数でオプションを上書き
    if (options) {
        Object.keys(options).forEach(function(key) {
            this.options[key] = options[key];
        }.bind(this));
    }

    // DOMElementをセット
    this.el = {};
    if (!this.createDOM()) {
        console.error('[error] 対象のElementを参照できませんでした。-> ' + this.options.el);
        return false;
    }

    // 日付が文字列だったら調整する
    this.checkDate();

    // 現在の表示
    this.current = {};

    // 初期化
    this.init(this.options.date);
}

/**
 * DOMELementをセット
 */
Calendar.prototype.createDOM = function() {
    // parent要素を取得
    this.el.wrap = this.options.el.indexOf('#') == 0 ? document.getElementById(this.options.el.replace('#', '')) : document.querySelector(this.options.el);

    if (!this.el.wrap) {
        // 取得できなければ終了
        return false;
    } else {
        // 取得できればchildren要素を取得
        this.el.year = this.el.wrap.querySelector('.js-calendar-year');
        this.el.month = this.el.wrap.querySelector('.js-calendar-month');
        this.el.calendar = this.el.wrap.querySelector('.js-calendar');
        this.el.left = this.el.wrap.querySelector('.js-calendar-left');
        this.el.right = this.el.wrap.querySelector('.js-calendar-right');

        // ページングにイベント付与
        if (this.options.paging) {
            this.el.left.addEventListener('click', this.prev.bind(this));
            this.el.right.addEventListener('click', this.next.bind(this));
        } else {
            this.el.left.remove();
            this.el.right.remove();
        }
        return true;
    }
}

/**
 * 日付が文字列だった時にdateに変換する
 */
Calendar.prototype.checkDate = function() {
    // 日付が文字列だった時に年/月の形であれば吸収してあげる
    if (typeof this.options.date === 'string') {
        var separatorList = ['/', '-', '.', ' '];
        var isConvertedDate = false;
        for (var i = 0, len = separatorList.length; i < len; i++) {
            if (this.options.date.indexOf(separatorList[i]) != -1) {
                this.options.date = this.splitDate(this.options.date, separatorList[i]);
                isConvertedDate = true;
                break;
            }
        }
        // ダメだったときは当月を表示
        if (!isConvertedDate) {
            this.options.date = new Date();
        }
    }
}

/**
 * 文字列の日付からDateに変換
 * @param {*} date 
 * @param {*} separator 
 */
Calendar.prototype.splitDate = function(date, separator) {
    var tmp = date.split(separator);
    return new Date(tmp[0], tmp[1]-1, 1);
}

/**
 * 初期化
 * @param {*} date 表示する日付
 */
Calendar.prototype.init = function(date) {
    // アニメーション用に移動の向きを取得
    var direction = (this.current.date > date) ? 'left' : 'right';

    // targetDateの情報を取得
    this.setDate(date);

    // 描画
    if (this.options.anime) {
        // アニメーション有り
        switch(this.options.anime) {
            case 'fade':
                // フェード
                var self = this; // 扱いやすいように
                self.el.wrap.style.transition = (self.options.animeSpeed / 1000) + 's';
                self.el.wrap.style.opacity = '0';
                setTimeout(function() {
                    self.draw();
                    setTimeout(function() {
                        self.el.wrap.style.opacity = '1';
                        self.el.calendar.style.transition = '';
                    }, self.options.animeSpeed);
                }, self.options.animeSpeed);
                break;

            case 'slide':
                // スライド
                var self = this;
                self.el.wrap.style.transition = (self.options.animeSpeed / 1000) + 's';
                self.el.wrap.style.opacity = '0';
                self.el.wrap.style.transform = direction === 'right' ? 'translateX(-100px)' : 'translateX(100px)';
                setTimeout(function() {
                    self.el.wrap.style.transform = direction === 'right' ? 'translateX(100px)' : 'translateX(-100px)';
                    self.draw();
                    setTimeout(function() {
                        self.el.wrap.style.opacity = '1';
                        self.el.calendar.style.transition = '';
                        self.el.wrap.style.transform = 'translateX(0)';
                    }, self.options.animeSpeed);
                }, self.options.animeSpeed);
                break;

            case 'custom':
                // before, afterクラスを付け替えるので、cssで好きにアニメーションをつけられる
                var self = this;
                self.el.wrap.classList.add('animate-before');
                setTimeout(function() {
                    self.el.wrap.classList.remove('animate-before');
                    self.el.wrap.classList.add('animate-after');
                    self.draw();
                    setTimeout(function() {
                        self.el.wrap.classList.remove('animate-after');
                    }, self.options.animeSpeed);
                }, self.options.animeSpeed);
                break;

            default:
                // 一致するアニメーションがなければ普通に描画
                this.el.wrap.style.opacity = '1';
                this.el.calendar.style.transition = '';
                this.draw();
                break;
        }
    } else {
        // アニメーションなし
        this.el.wrap.style.opacity = '1';
        this.el.calendar.style.transition = '';
        this.draw();
    }
}

/**
 * 情報をセット
 */
Calendar.prototype.setDate = function(date) {
    this.current = {
        date: date,
        year: date.getFullYear(),
        month: date.getMonth()
    };
}

/**
 * 描画
 */
Calendar.prototype.draw = function() {
    var start = new Date(this.current.year, this.current.month, 1); // 最初の日を取得
    var end = new Date(this.current.year, this.current.month+1, 0); // 最後の日の取得
    var beforeDate = new Date(this.current.year, this.current.month, 0); // 先月の最後の日

    var startDate = start.getDate(); // 最初の日にち
    var endDate = end.getDate(); // 最後の日にち

    var startDay = start.getDay(); // 初めの曜日
    var endDay = end.getDay(); // 終わりの曜日

    var afterFirstDay = 1; // 次月の最初の日
    var beforeLastDay = beforeDate.getDate() - (startDay-1); // 先月の最後の日

    // カレンダーのhtml 
    var bodyHtml = '';
    var textDate = 1;
    var isSkip = true;

    // カレンダーの行数
    var rowMonth = (endDate > 30 && startDay == 5) || (endDate > 29 && startDay == 6) ? 6 : 5;

    // スケジュールを取得
    var scheduleList = !this.options.schedule ? null : this.options.schedule.filter(function(e) {
        if (e.year === this.current.year && e.month === this.current.month+1) {
            return true;
        }
    }.bind(this));

    // 列
    for (var row = 0; row < rowMonth; row++) {
        // 行
        for (var col = 0; col < 7; col++) {
            if (row === 0 && startDay === col) {
                isSkip = false;
            }
            if (textDate > endDate) {
                isSkip = true;
            }

            if (isSkip && textDate > 1) {
                var textTd = isSkip ? afterFirstDay++ : textDate++;
            } else {
                var textTd = isSkip ? beforeLastDay++ : textDate++;
            }

            // 祝日
            var sunClass = (col == 6) ? 'holiday--blue' : (col == 0) ? 'holiday' : '';

            // 当月以外
            if (isSkip) {
                sunClass += ' notarget';
            }

            // スケジュールは当月だけ
            var schedule = '';
            if (!isSkip) {
                if (scheduleList && scheduleList.length > 0 && scheduleList[0].schedule) {
                    if (scheduleList[0].schedule[textTd]) {
                        schedule = '<div class="schedule-content">' + scheduleList[0].schedule[textTd] + '</div>';
                    }
                }
            }

            bodyHtml += '<div class="' + sunClass + '"><div>' + textTd + schedule + '</div></div>';
        }
    }

    // 年、月を表示
    this.el.year.textContent = this.current.year;
    this.el.month.textContent = this.current.month+1;
    this.el.calendar.innerHTML = '<div>' + bodyHtml + '</div>';
}

/**
 * 一つ先へ移動
 */
Calendar.prototype.next = function() {
    this.init(new Date(this.current.year, this.current.month+1, 1));
}

/**
 * 一つ前に移動
 */
Calendar.prototype.prev = function() {
    this.init(new Date(this.current.year, this.current.month-1, 1));
}