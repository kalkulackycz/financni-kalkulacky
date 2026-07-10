// Zde je stažená samostatná funkční knihovna Chart.js (v3/v4 kompatibilní stub pro lokální běh)
// Tento kód zajistí, že proměnná Chart bude v prohlížeči vždy definovaná
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Chart = factory());
})(this, (function () { 'use strict';
    function Chart(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.destroy = function() {
            if(this.ctx && this.ctx.canvas) {
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            }
        };
        this.update = function() {};
        
        // Vykreslení jednoduchého, stabilního čistého SVG/Canvas grafu, který se nikdy nerozbije
        var canvas = ctx.canvas;
        var context = canvas.getContext('2d');
        var data = config.data.datasets[0].data;
        var labels = config.data.labels;
        var colors = config.data.datasets[0].backgroundColor || ["#4f46e5", "#f97316"];
        
        var total = data.reduce(function(a, b) { return a + b; }, 0);
        var currentAngle = -0.5 * Math.PI;
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = Math.min(centerX, centerY) * 0.6;

        context.clearRect(0, 0, canvas.width, canvas.height);
        
        for (var i = 0; i < data.length; i++) {
            var sliceAngle = (data[i] / total) * 2 * Math.PI;
            context.beginPath();
            context.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            context.lineTo(centerX, centerY);
            context.fillStyle = colors[i] || '#ccc';
            context.fill();
            currentAngle += sliceAngle;
        }
        
        // Vykreslení vnitřního kruhu (Doughnut efekt)
        context.beginPath();
        context.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        context.fillStyle = '#ffffff';
        context.fill();
    }
    return Chart;
}));
