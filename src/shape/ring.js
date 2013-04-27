/**
 * zrender
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 * shape类：圆环
 * 可配图形属性：
   {
       // 基础属性
       shape  : 'ring',         // 必须，shape类标识，需要显式指定
       id     : {string},       // 必须，图形唯一标识，可通过zrender实例方法newShapeId生成
       zlevel : {number},       // 默认为0，z层level，决定绘画在哪层canvas中
       invisible : {boolean},   // 默认为false，是否可见

       // 样式属性，默认状态样式样式属性
       style  : {
           x             : {number},  // 必须，圆心横坐标
           y             : {number},  // 必须，圆心纵坐标
           r0            : {number},  // 必须，内圆半径
           r             : {number},  // 必须，外圆半径
           brushType     : {string},  // 默认为fill，绘画方式
                                      // fill(填充) | stroke(描边) | both(填充+描边)
           color         : {color},   // 默认为'#000'，填充颜色，支持rgba
           strokeColor   : {color},   // 默认为'#000'，描边颜色（轮廓），支持rgba
           lineWidth     : {number},  // 默认为1，线条宽度，描边下有效

           opacity       : {number},  // 默认为1，透明度设置，如果color为rgba，则最终透明度效果叠加
           shadowBlur    : {number},  // 默认为0，阴影模糊度，大于0有效
           shadowColor   : {color},   // 默认为'#000'，阴影色彩，支持rgba
           shadowOffsetX : {number},  // 默认为0，阴影横向偏移，正值往右，负值往左
           shadowOffsetY : {number},  // 默认为0，阴影纵向偏移，正值往下，负值往上

           text          : {string},  // 默认为null，附加文本
           textFont      : {string},  // 默认为null，附加文本样式，eg:'bold 18px verdana'
           textPosition  : {string},  // 默认为outside，附加文本位置。
                                      // outside | inside
           textAlign     : {string},  // 默认根据textPosition自动设置，附加文本水平对齐。
                                      // start | end | left | right | center
           textBaseline  : {string},  // 默认根据textPosition自动设置，附加文本垂直对齐。
                                      // top | bottom | middle |
                                      // alphabetic | hanging | ideographic
           textColor     : {color},   // 默认根据textPosition自动设置，默认策略如下，附加文本颜色
                                      // 'inside' ? '#fff' : color
       },

       // 样式属性，高亮样式属性，当不存在highlightStyle时使用基于默认样式扩展显示
       highlightStyle : {
           // 同style
       }

       // 交互属性，详见shape.Base

       // 事件属性，详见shape.Base
   }
         例子：
   {
       shape  : 'ring',
       id     : '123456',
       zlevel : 1,
       style  : {
           x : 200,
           y : 100,
           r : 50,
           color : '#eee',
           text : 'Baidu'
       },
       myName : 'kener',  // 可自带任何有效自定义属性

       clickable : true,
       onClick : function(eventPacket) {
           alert(eventPacket.target.myName);
       }
   }
 */
define(
    function(require) {
        function Ring() {
            this.type = 'ring';
        }

        Ring.prototype = {
            /**
             * 创建圆环路径，依赖扇形路径
             * @param {Context2D} ctx Canvas 2D上下文
             * @param {Object} style 样式
             */
            buildPath : function(ctx, style) {
                var shape = require('../shape');
                shape.get('sector').buildPath(
                    ctx,
                    {
                        x : style.x,
                        y : style.y,
                        r0 : style.r0,
                        r : style.r,
                        startAngle : 0,
                        endAngle : 360
                    }
                );
                return;
            },

            /**
             * 画刷
             * @param ctx       画布句柄
             * @param e         形状实体
             * @param isHighlight   是否为高亮状态
             */
            brush : function(ctx, e, isHighlight) {
                var style = {};
                for (var k in e.style) {
                    style[k] = e.style[k];
                }

                if (isHighlight) {
                    // 根据style扩展默认高亮样式
                    style = this.getHighlightStyle(
                        style, e.highlightStyle || {}
                    );
                }

                ctx.save();
                this.setContext(ctx, style);

                // 设置transform
                var m = this.updateTransform(e);
                if (!(m[0] == 1
                    && m[1] === 0
                    && m[2] === 0
                    && m[3] == 1
                    && m[4] === 0
                    && m[5] === 0)
                ) {
                    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                }

                ctx.beginPath();
                this.buildPath(ctx, style);
                ctx.closePath();

                style.brushType = style.brushType || 'fill';    // default

                if (style.brushType == 'fill' || style.brushType == 'both') {
                    ctx.fill();
                }

                if (style.brushType == 'stroke' || style.brushType == 'both') {
                    ctx.beginPath();
                    ctx.moveTo(style.r0 + style.x, style.y);
                    ctx.arc(style.x, style.y, style.r0, 0, Math.PI * 2, true);

                    ctx.moveTo(style.r + style.x, style.y);
                    ctx.arc(style.x, style.y, style.r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.stroke();
                }

                if (style.text) {
                    // 字体颜色策略
                    style.textColor = style.textColor
                        || (e.style || e.highlightStyle).color
                        || (e.style || e.highlightStyle).strokeColor;

                    this.drawText(ctx, style);
                }

                ctx.restore();
                return;
            },

            /**
             * 返回矩形区域，用于局部刷新和文字定位
             * @param {Object} style
             */
            getRect : function(style) {
                return {
                    x : style.x - style.r,
                    y : style.y - style.r,
                    width : style.r * 2,
                    height : style.r * 2
                };
            }
        };

        var base = require('./base');
            base.derive(Ring);

        return Ring;
    }
);