module.exports = Map;

function Map () {
    if (!(this instanceof Map)) return new Map;
    this.element = createElement('svg');
}

Map.prototype.plot = function (points) {
    var poly = createElement('path');
    points[0] += 100;
    points[1] += 400;
    
    poly.setAttribute('d', 'M ' + points.join(' l '));
    poly.setAttribute('stroke-width', '2px');
    poly.setAttribute('stroke', 'rgb(255,31,31)');
    poly.setAttribute('fill', 'transparent');
    this.element.appendChild(poly);
    return this;
};

Map.prototype.appendTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    target.appendChild(this.element);
    return this;
};

function createElement (name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
