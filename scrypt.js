const getD = {
    id: (id) => document.getElementById(id),
    class: (classname) => document.getElementsByClassName(classname),
}
window.addEventListener("keydown", (pressedKey) => {
    console.log(pressedKey.code);
    MainFinder.setPoints(pressedKey, MainField.isHovered);
})
const Field = class{
    constructor(x, y, diagonalAllow){
        this.map = new Map();
        this.x = x;
        this.y = y;
        this.isHovered = null;
        this.diagonalAllow = diagonalAllow;
        let [xi, yi] = [0, 0];
        while(yi < this.y){
            let cell = new Cell(this, xi, yi, ["PF__item", "static"]);
            this.map.set(xi + "-" + yi, cell);
            if(xi >= this.x - 1){
                xi = 0;
                yi++;
            }else{xi++}
        };
        console.log(this.map, this.map.size);
    }
    generateMap = function(containerClass){
        let mapContainer = getD.class(containerClass)[0];
        console.log(mapContainer);
        mapContainer.style.gridTemplateRows = `repeat(${this.y}, 1fr)`;
        mapContainer.style.gridTemplateColumns = `repeat(${this.x}, 1fr)`;
        let [xi, yi] = [0, this.y - 1];
        while(0 <= yi){
            mapContainer.appendChild(this.map.get(xi + "-" + yi).dom);
            if(xi >= this.x - 1 && 0 <= yi){
                xi = 0;
                yi--;
            }else if(yi < this.y){
                xi++;
            }
        }
        [xi, yi] = [0, this.y - 1];
        while(0 <= yi){
            this.map.get(xi + "-" + yi).setVertexes();
            if(xi >= this.x - 1 && 0 <= yi){
                xi = 0;
                yi--;
            }else if(yi < this.y){
                xi++;
            }
        }
    }
    setWalls = (wallPercent) => {
        this.map.forEach((value, key)=>{
            if(Math.random() <= wallPercent/100){
                this.map.get(key).setState("blocked");
                this.updateCellVertexes(key);
            }
        })
    }
    updateCellVertexes = function(cellPosition){
        for(let vertex of this.map.get(cellPosition).vertexes){
            this.map.get(vertex).setVertexes();
            console.log(`vertexses of ${vertex} is updated`);
        }
    }
}
const Cell = class{
    constructor(field, xi, yi, [cls, state]){
        this.field = field;
        this.x = xi;
        this.y = yi;
        this.dom = document.createElement("cell");
        this.dom.classList.add(cls, state);
        this.dom.addEventListener("mouseover", () => {
            field.isHovered = this.x + "-" + this.y;
            getD.class("main__display")[0].innerText = `cell {${this.x}; ${this.y}} is hovered`;
        });
    }
    setState = (newState, forced) => {
        if(forced || this.dom.classList[1] !== "blocked"){
            this.dom.classList.replace(this.dom.classList[1], newState);
        }
    }
    getCoordinates = () => {return [this.x, this.y]};
    getPosition = () => {return (this.x+"-"+this.y)};
    setVertexes = () => {
        let checkIsBlocked = (coordinates) => {
            let [x, y] = coordinates;
            console.log(x, y, coordinates);
            if(x >= 0 && this.field.x - 1 >= x && y >= 0 && this.field.y - 1 >= y){
                if(this.field.map.get(x + "-" + y).dom.classList[1] !== "blocked"){
                    return true;
                }
                return false;
            }else{
                return false;
            };
        };
        let vertexList = [];
        let possibleVertexes = [
                [this.x, this.y + 1], [this.x + 1, this.y],
                [this.x, this.y - 1], [this.x - 1, this.y],
                [this.x - 1, this.y + 1], [this.x + 1, this.y + 1],
                [this.x + 1, this.y - 1], [this.x - 1, this.y - 1]
            ];
        if(checkIsBlocked(possibleVertexes[0])){vertexList.push(possibleVertexes[0].join("-"))};
        if(checkIsBlocked(possibleVertexes[1])){vertexList.push(possibleVertexes[1].join("-"))};
        if(checkIsBlocked(possibleVertexes[2])){vertexList.push(possibleVertexes[2].join("-"))};
        if(checkIsBlocked(possibleVertexes[3])){vertexList.push(possibleVertexes[3].join("-"))};
        if(this.field.diagonalAllow){
            if(checkIsBlocked(possibleVertexes[4])){vertexList.push(possibleVertexes[4].join("-"))};
            if(checkIsBlocked(possibleVertexes[5])){vertexList.push(possibleVertexes[5].join("-"))};
            if(checkIsBlocked(possibleVertexes[6])){vertexList.push(possibleVertexes[6].join("-"))};
            if(checkIsBlocked(possibleVertexes[7])){vertexList.push(possibleVertexes[7].join("-"))};
        }
        this.vertexes = vertexList;
        console.log("VERTEXES UPDATED IN "+this.x+"-"+this.y);
    }
}
const PathFinder = class{
    constructor(field){
        this.points = [null, null];
        this.path = null;
        this.field = field;
        this.graph = new Map;
    }
    nullifyField = () => {
        this.graph.forEach((value, key)=>{
            if(this.field.map.get(key).dom.classList[1] !== "startPoint" && this.field.map.get(key).dom.classList[1] !== "endPoint"){
                this.field.map.get(key).setState("static");
            }
        })
        this.graph = new Map;
    }
    setPoints = (event, cellPosition) => {
        let mapG = (cellPos) => this.field.map.get(cellPos);
        if(event.code == "KeyB" && !this.points.includes(cellPosition)){
            mapG(cellPosition).setState("blocked");
            this.field.updateCellVertexes(cellPosition);
        }else if(event.code == "KeyC" && !this.points.includes(cellPosition)){
            mapG(cellPosition).setState("static", true);
            this.field.updateCellVertexes(cellPosition);
        }else if(event.code == "KeyS" && cellPosition !== this.points[1]){
            if(this.points[0] !== null){
                mapG(this.points[0]).setState("static");
            }
            this.points[0] = mapG(cellPosition).getPosition();
            console.log("start position was set at " + this.points[0]);
            mapG(cellPosition).setState("startPoint");
        }else if(event.code == "KeyE" && cellPosition !== this.points[0]){
            if(this.points[1] !== null){
                mapG(this.points[1]).setState("static");
            }
            this.points[1] = mapG(cellPosition).getPosition();
            console.log("end position was set at " + this.points[1]);
            mapG(cellPosition).setState("endPoint");
        }
        if(this.points[0] && this.points[1]) {
            this.nullifyField();
            this.searchPath();
        }
    }
    searchPath = () => {
        let [startPointPos, endPointPos] = this.points;
        let mapG = (cellPos) => this.field.map.get(cellPos);
        let queue = [startPointPos];
        let visited = [startPointPos];
        let completed = false;
        let i = 0;
        while(completed !== true){
            if(!queue[i]){
                console.log("can't find path");
                break;
            }
            let vertexes = mapG(queue[i]).vertexes;
            for(let j = 0; j < vertexes.length; j++){
                // console.log(`current queue => vertex cell: ${queue[i]} => ${vertexes[j]}`); 
                // console.log(`current vertexes: ${vertexes}`);
                if(vertexes[j] === this.points[1]){
                    this.path = (vertexes[j]+" "+queue[i]+" "+this.graph.get(queue[i])).split(" ");
                    this.graph.set(vertexes[j], queue[i] + " " + this.graph.get(queue[i]));
                    if(this.path.length > 2){
                        this.path.forEach((cellPos) => {
                            if(cellPos !== this.points[0] && cellPos !== this.points[1]){
                                mapG(cellPos).setState("completed");
                            };
                        });
                    }
                    console.log("Конечный путь найден: " + this.path, this.path.length);
                    completed = true;
                    break;
                }
                if(!visited.includes(vertexes[j])){// проверка на посещение
                    if(this.graph.get(queue[i])){
                        this.graph.set(vertexes[j], queue[i] + " " + this.graph.get(queue[i]));
                    } else if(mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                        this.graph.set(vertexes[j], queue[i]);
                    }
                    visited.push(vertexes[j]);
                }
                if(!queue.includes(vertexes[j])){
                    queue.push(vertexes[j]);
                }
                if(mapG(vertexes[j]).dom.classList[1] !== "startPoint" && mapG(vertexes[j]).dom.classList[1] !== "endPoint"){
                    mapG(vertexes[j]).setState("inProcess");
                }
            }
            i++;
        }
    }
}
let MainField = new Field(20, 20, true);
let MainFinder = new PathFinder(MainField);
MainField.generateMap("PF__map");
MainField.setWalls(25);