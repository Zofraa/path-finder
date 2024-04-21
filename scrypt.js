const getD = {
    id: (id) => document.getElementById(id),
    class: (classname) => document.getElementsByClassName(classname),
}
window.addEventListener("keydown", (pressedKey) => {
    console.log(pressedKey.code);
    MainFinder.setPoints(pressedKey, MainField.isHovered);
})
const Field = class{
    constructor(x, y){
        this.map = new Map();
        this.x = x;
        this.y = y;
        this.isHovered = null;
        let [xi, yi] = [0, 0];
        while(yi < this.y){
            let cell = new Cell(this, xi, yi, ["PF__item", "static"]);
            this.map.set(xi + "-" + yi, cell);
            if(xi >= this.x - 1){
                xi = 0;
                yi++;
            }else{xi++};
        }
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
    }
}
const Cell = class{
    constructor(field, x, y, [cls, state]){
        this.x = x;
        this.y = y;
        let vector = [
                [x, y + 1], [x + 1, y],
                [x, y - 1], [x - 1, y]
            ];
        let vertexes = [];
        if(y < field.y - 1){vertexes.push(vector[0].join("-"))};
        if(x < field.x - 1){vertexes.push(vector[1].join("-"))};
        if(y > 0){vertexes.push(vector[2].join("-"))};
        if(x > 0){vertexes.push(vector[3].join("-"))};
        this.vertexes = vertexes;
        this.dom = document.createElement("cell");
        this.dom.classList.add(cls, state);
        this.dom.addEventListener("mouseover", () => {
            MainField.isHovered = this.x + "-" + this.y;
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
        }else if(event.code == "KeyC" && !this.points.includes(cellPosition)){
            mapG(cellPosition).setState("static", true);
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
        console.log("Start Position: " + startPointPos + "\n" + "End Position: " + endPointPos);
        while(completed === false){
            if(!queue[i]){
                console.log("can't find path");
                break;
            }
            let vertexes = mapG(queue[i]).vertexes;
            for(let j = 0; j < vertexes.length; j++){
                if(vertexes[j] === this.points[1] && mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                    this.path = (vertexes[j]+" "+queue[i]+" "+this.graph.get(queue[i])).split(" ");
                    this.graph.set(vertexes[j], queue[i] + " " + this.graph.get(queue[i]));
                    this.path.forEach((cellPos) => {
                        if(cellPos !== this.points[0] && cellPos !== this.points[1]){
                            mapG(cellPos).setState("completed");
                        }
                    })
                    console.log("Конечный путь найден");
                    completed = true;
                    break;
                }
                if(!visited.includes(vertexes[j])){
                    if(this.graph.get(queue[i]) && mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                        this.graph.set(vertexes[j], queue[i] + " " + this.graph.get(queue[i]));
                    } else if(mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                        this.graph.set(vertexes[j], queue[i]);
                    }
                    visited.push(vertexes[j]);
                }
                if(!queue.includes(vertexes[j]) && mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                    queue.push(vertexes[j]);
                }
                if(mapG(vertexes[j]).dom.classList[1] !== "startPoint" && mapG(vertexes[j]).dom.classList[1] !== "endPoint" && mapG(vertexes[j]).dom.classList[1] !== "blocked"){
                    mapG(vertexes[j]).setState("inProcess");
                }
            }
            console.log("Graph: ", this.graph);
            i++;
        }
    }
}
let MainField = new Field(20, 20);
let MainFinder = new PathFinder(MainField);
MainField.generateMap("PF__map");