function Point (x, y) {
    this.x = x;
    this.y = y;
    this.isSteiner = false;

    this.distance = function (p) {
        return Math.sqrt(Math.pow(p.x - this.x) + Math.pow(p.y - this.y));
    };

    this.dot = function (p) {
        return this.x * p.x + this.y * p.y;
    };

    this.scalarMult = function (scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    };

    this.subtract = function (p) {
        return this.add(p.scalarMult(-1));
    };

    this.add = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    };

    this.cross = function (p) {
        return this.x * p.y - p.x * this.y;
    };

    this.thetaTo = function (p) {
        return Math.atan2(this.y-p.y,this.x-p.x);
    }

    this.leftTurn = function (p2, p3) {
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) < 0) {
            return true;
        }
        return false;
    };

    this.rightTurn = function (p2, p3) {
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) > 0) {
            return true;
        }
        return false;
    };

    this.draw = function (context,fillStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "red";
        context.beginPath();
        context.arc(this.x, 600-this.y, 2, 0, 2 * Math.PI, false);
        context.fillStyle = fillStyle;
        context.fill();
    };

    this.canSee = function (p,pgon) {
        s = new LineSegment(this,p);
        intersections = s.polygonIntersections(pgon);
        if (intersections.length == 0) return true;
        intersections.sort(function (p1, p2) {
            return p1.distance(this)-p2.distance(this);
        });
        if (intersections[0].distance(p) < 0.005) {
            return true;
        }
        return false;
    }

}
Vector = Point;

function Line (a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.intersection = function (l) {
        if (this.a * l.b - this.b * l.a == 0) return undefined;
        a = this.a;
        b = this.b;
        e = this.c;
        c = l.a;
        d = l.b;
        f = l.c;
        return new Point((e*d-b*f)/(a*d-b*c),(a*f-e*c)/(a*d-b*c))
    };
}

function Ray(p,theta) {
    this.p = p;
    this.theta = theta;

    this.segmentIntersection = function (s) {
        lineIntersection = s.lineIntersection(this.toLine());
        if (lineIntersection == undefined) return undefined;
        d = new Point(this.p.x+Math.cos(theta), this.p.y+Math.sin(theta));
        // x(t) = (p.x + (d.x-p.x)*t)
        // y(y) = (p.y + (d.y-p.y)*t)
        // t = (x(t)-p.x)/(d.x-p.x)
        if ((lineIntersection.x-this.p.x)/(d.x-this.p.x) >= 0) return lineIntersection;
        return undefined;
    };

    this.toLine = function (s) {
        return new LineSegment(p,new Point(this.p.x+Math.cos(theta),
                                           this.p.y+Math.sin(theta))).toLine();
    };

    this.polygonIntersections = function (pgon) {
        r = this;
        return pgon.edges().map(function (e) {
            return r.segmentIntersection(e);
        }).filter(function (x) { return x != undefined })
    }
}

function LineSegment (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;

    this.intersects = function (s) {
        return (this.p1.rightTurn(s.p1, s.p2) != this.p2.rightTurn(s.p1, s.p2)) &&
                (s.p1.rightTurn(this.p1, this.p2) != s.p2.rightTurn(this.p1, this.p2));
    };

    this.intersection = function (s) {
        if (!this.intersects(s)) return undefined;
        return this.toLine().intersection(s.toLine())
    };

    this.lineIntersection = function (l) {
        p = this.toLine().intersection(l);
        if (p == undefined) return undefined;
        if (p.x >= Math.min(this.p1.x, this.p2.x) && 
            p.x <= Math.max(this.p1.x, this.p2.x) &&
            p.y >= Math.min(this.p1.y, this.p2.y) &&
            p.y <= Math.max(this.p1.y, this.p2.y)) {
            return p;
        }
        return undefined;
    };

    this.toLine = function () {
        return new Line(this.p1.y - this.p2.y,
                        this.p2.x - this.p1.x,
                        -1*((this.p1.x - this.p2.x) * this.p1.y + (this.p2.y - this.p1.y) * this.p1.x));
    };

    this.polygonIntersections = function (pgon) {
        s = this;
        return pgon.edges().map(function (e) {
            return s.segmentIntersection(e);
        }).filter(function (x) { return x != undefined })
    }

    this.toRay = function () {
        theta = this.p1.thetaTo(this.p2);
        return new Ray(this.p1,theta);
    }

    this.containsPoint = function (p) {
        // x(t) = (p1.x+(p2.x-p1.x)*t)
        // y(t) = (p1.y+(p2.y-p1.y)*t)
        // p is on s if we can solve for t and 0<=t<=1
        tx = (p.x-this.p1.x)/(this.p2.x-this.p1.x);
        ty = (p.y-this.p1.y)/(this.p2.y-this.p1.y);
        if (this.p2.x-this.p1.x==0) tx = ty;
        if (this.p2.y-this.p1.y==0) ty = tx;
        if (Math.abs(tx-ty)<0.001 && tx >= 0 && tx <= 1) return true;
        return false;
    };

    this.draw = function (context,color) {
        color = typeof color !== 'undefined' ? color : "#000";
        context.strokeStyle = color;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(p1.x, 600-p1.y);
        context.lineTo(p2.x, 600-p2.y);
        context.closePath();
        context.stroke();
    };
}

function PointSet (pointList) {
    this.points = pointList;

    this.convexHull = function () {
        if (this.points.length < 3) return undefined;
        minX = undefined;
        idx = 0;
        for (i=0;i<this.points.length;i++) {
            if (minX == undefined || this.points[i].x < minX.x) {
                minX = this.points[i];
                idx = i;
            }
        }
        sorted = this.points.slice(0,idx).concat(this.points.slice(idx+1)).sort(function (a,b) {
            ta = minX.thetaTo(a);
            tb = minX.thetaTo(b);
            if (ta < 0) ta += 360;
            if (tb < 0) tb += 360;
            return ta - tb;
        });
        hull = [minX,sorted[0]];
        for (i=1;i<sorted.length;i++) {
            while (hull.length > 1 && hull[hull.length-2].leftTurn(hull[hull.length-1],sorted[i])) {
                hull.pop();
            }
            hull.push(sorted[i]);
        } 
        return new Polygon(hull);
    }
}

function Polygon (pointList) {
    this.pointList = pointList;
    this.points = function () {
        return this.pointList;
    };

    this.push = function (p) {
        this.pointList.push(p);
    };

    this.pop = function () {
        return this.pointList.pop();
    };

    this.map = function (f) {
        this.pointList.map(f);
    };

    this.edges = function () {
        return this.pointList.map(function (p, index, array) {
            return new LineSegment(p, array[(index + 1) % array.length]);
        });
    };

    this.segmentIntersections = function (s) {
        return this.edges().map(function (e) {
            return e.intersection(s);
        }).filter(function (p) {return p != undefined});  
    };

    this.lineIntersections = function (l) {
        return this.edges().map(function (e) {
            return e.lineIntersection(l);
        }).filter(function (p) {return p != undefined});
    };

    this.containsPoint = function (p) {
        return this.lineIntersections(new LineSegment(p,
                                                 new Point(p.x,p.y+1)
                                                ).toLine()).filter(
                                                            function (a) { 
                                                                return a.y > p.y 
                                                            }).length%2 == 1;
    };

    this.visibleFrom = function (p) {
        if (!this.containsPoint(p)) return undefined;
        edges = this.edges();
        pl = this.pointList;
        var stack = [pl[0]];
        var condition = undefined;
        for (i=0;i<pl.length-1;i++) {
            point = pl.slice(1)[i];
            t = stack[stack.length-1]; // t for top
            if (p.rightTurn(t,point) && condition == undefined) {
                stack.push(point);
            } else {
                if (stack.length < 2 || point.rightTurn(stack[stack.length-1],stack[stack.length-2])) {
                    // upward backtrack
                    if (condition == undefined) {
                        condition = function (pp) {
                            e = new LineSegment(pp,pl[(i+2)%pl.length]);
                            l = new LineSegment(p,t).toLine()
                            newPoint = e.lineIntersection(l);
                            if (newPoint) newPoint.isSteiner = true;
                            return newPoint;
                        };
                    } 
                    newPoint = condition(point);
                    if (newPoint != undefined) {
                        stack.push(newPoint);
                        condition = undefined;
                    }
                } else {
                    // downward backtrack
                    l = new LineSegment(p,point).toLine();
                    newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    while (newPoint == undefined) {
                        stack.pop();
                        newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    }
                    newPoint.isSteiner = true;
                    stack.pop();
                    stack.push(newPoint);
                    stack.push(point);
                }
            }
        }
        return new Polygon(stack);
    };

    this.draw = function (context, fillStyle, lineStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "rgba(0,255,0,0.1)";
        lineStyle = typeof lineStyle !== 'undefined' ? lineStyle : "#000";
        context.strokeStyle = lineStyle
         context.fillStyle = fillStyle
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(this.pointList.x, 600-this.pointList.y);
        this.pointList.slice(1).concat(this.pointList.slice(0,1)).map(function (p) {
            context.lineTo(p.x,600-p.y);
        });
        context.closePath();
        context.stroke();
        context.fill();
        // this.points()[0].draw(context,"blue");
    };
}


var points = [];
mouse = undefined; 
window.addEventListener('mousedown',mouseDown, false);
window.addEventListener('mousemove',mouseMove, false);
window.addEventListener('keydown', keyPress, false);
function getEventCoords(ev){
    if (ev.layerX) { //Firefox
        return new Point(ev.layerX, 600-ev.layerY);
    }
    return new Point(ev.offsetX, 600-ev.offsetY); //Opera
}

function keyPress(e) {
    if (e.keyCode == 8) {
        points.pop();
        update();
    }
}

function mouseDown (ev) {
    points.push(getEventCoords(ev));
    update();
}

function mouseMove (ev) {
    mouse = getEventCoords(ev);
    update();
}

function getCanvas() {
  return document.getElementById('canvas');
}

function update () {
    var canvas = getCanvas();
    context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f00'; //red
    context.strokeStyle = '#000'; //green
    context.lineWidth = 4;
    containedIn = 0;
    containedInPoints = points.map(function () {return 0});
    for (i=0;i<points.length;i++) {
        points[i].draw(context,"black");
        for (j=i+1;j<points.length;j++) {
            for (k=j+1;k<points.length;k++) {
                triangle = new Polygon([points[i],points[j],points[k]]);
                if (triangle.containsPoint(mouse)) {
                   triangle.draw(context,"rgba(0,255,0,.05)");
                    containedIn++;
                } else {
                    triangle.draw(context,"rgba(0,0,0,0)");
                }
            }
        }
    }
    document.getElementById("count").innerHTML = containedIn;
}