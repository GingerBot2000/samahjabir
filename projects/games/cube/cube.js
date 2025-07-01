// board

let board;
let boardWidth = Math.min(window.innerWidth * 3/4, window.innerHeight * 3/4);
let boardHeight = boardWidth;
let context;

let points = 
[
    {x: -0.5, y: 0.5, z: 0.5}, // top left
    {x: 0.5, y: 0.5, z: 0.5}, // top right
    {x: 0.5, y: -0.5, z: 0.5}, // bottom right
    {x: -0.5, y: -0.5, z: 0.5}, // bottom left

    {x: -0.5, y: 0.5, z: -0.5}, // back top left
    {x: 0.5, y: 0.5, z: -0.5}, // back top right
    {x: 0.5, y: -0.5, z: -0.5}, // back bottom right
    {x: -0.5, y: -0.5, z: -0.5} // back bottom lef
];

let originalPoints = 
[
    {x: -0.5, y: 0.5, z: 0.5}, // top left
    {x: 0.5, y: 0.5, z: 0.5}, // top right
    {x: 0.5, y: -0.5, z: 0.5}, // bottom right
    {x: -0.5, y: -0.5, z: 0.5}, // bottom left

    {x: -0.5, y: 0.5, z: -0.5}, // back top left
    {x: 0.5, y: 0.5, z: -0.5}, // back top right
    {x: 0.5, y: -0.5, z: -0.5}, // back bottom right
    {x: -0.5, y: -0.5, z: -0.5} // back bottom lef
];

let projectedPoints = [];

let fullB =
[
    {x: -1, y: 1, z: -1},
    {x: 1, y: 1, z: -1},
    {x: -1, y: -1, z: -1},
    {x: 1, y: -1, z: -1},
    
    {x: -1, y: 1, z: 1},
    {x: 1, y: 1, z: 1},
    {x: -1, y: -1, z: 1},
    {x: 1, y: -1, z: 1}
];

// mouse control
var mouse = 
{
    x: 0,
    y: 0
}

function mousemovement(event)
{
    mouse.x = (event.x - window.innerWidth/2) / window.innerWidth * 2;
    mouse.y = (event.y - window.innerHeight/2) / window.innerHeight * -2;
    //console.log("mouse move", mouse, "origi", event.x, event.y);

    xAngle = mouse.x * -Math.PI / 10;
    yAngle = mouse.y * -Math.PI / 10;

    if(zAngle == -1) {zAngle = 0;}

}
window.addEventListener("mousemove", mousemovement);
window.addEventListener("keydown", keyPressed);

function keyPressed(event)
{
    zAngle = ( zAngle + 0.05) % Math.PI/10
}

window.onload = function()
{
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d"); // used for drawing on board

    let xAngle = 0;
    let yAngle = 0;
    let zAngle = -1;

    update();

}

window.onresize = function() {
    boardWidth = Math.min(window.innerWidth * 3/4, window.innerHeight * 3/4);
    boardHeight = boardWidth;
    boardLength = boardWidth;
    board.width = boardWidth;
    board.height = boardHeight;
};

function update()
{
    requestAnimationFrame(update);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    points = rotate(xAngle, yAngle, 0.1);

    projectedPoints = [];
    for(let i = 0; i < points.length; i++)
    {
        let point3D = points[i];
        let point2D = get2DPointFrom3D(point3D);
        point2D = resizePoint(point2D);
        projectedPoints.push(point2D);
        drawPoint(point2D);
    }

    for(let i = 0; i < 4; i++)
    {
        drawEdges(i);
    }
}

function get2DPointFrom3D(point)
{
    let newPoint = {x:point.x, y:point.y};

    return newPoint;
}

function drawPoint(point)
{
    let colour = "#ffffff";
    let r = 5;
    context.strokeStyle = colour;
    context.beginPath();
    context.arc( point.x, point.y, r, 0, 2 * Math.PI, true );
    context.stroke();
}

function resizePoint(point)
{
    let newX = point.x * boardWidth/2 + boardWidth/2;
    let newY = point.y * boardHeight/-2 + boardHeight/2;
    let newPoint = {x:newX, y:newY};

    return newPoint;
}

function drawEdges(i)
{
    connect( projectedPoints[i], projectedPoints[(i+1) % 4]); // points next to each other
    connect( projectedPoints[i+4], projectedPoints[((i+1) % 4) +4]); // back row
    connect( projectedPoints[i], projectedPoints[i+4]); // conecting two faces

    // to show points
    // context.font = "16px courier";
    // context.fillStyle = "blue";
    // context.fillText(i+4, projectedPoints[i+4].x, projectedPoints[i+4].y); // top corner
    // context.fillStyle = "red";
    // context.fillText(i, projectedPoints[i].x, projectedPoints[i].y); // top corner

}

function connect(a, b)
{
    colour = "#ffffff";
    context.strokeStyle = colour;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();

    //.log("connected ", a,b)
}

function rotate(xAngle, yAngle, zAngle)
{
    //! IF YOU WANT TO REUSE THESE ITS VERY DIFFERENT COS I MOVED AROUND WHICH IS THE ACTUAL X Y AND Z ROTATIONS TO FEEL NATURAL W THE MOUSE
    //! USE THESE ONES BELOW INSTEAD
    // let rotateY = [
    //     {x: Math.cos(yAngle), y: 0, z: Math.sin(yAngle)},
    //     {x: 0, y: 1, z: 0},
    //     {x: -Math.sin(yAngle), y: 0, z: Math.cos(yAngle)}
    // ];

    // let rotateX = [
    //     {x: 1, y: 0, z: 0},
    //     {x: 0, y: Math.cos(xAngle), z: -Math.sin(xAngle)},
    //     {x: 0, y: Math.sin(xAngle), z: Math.cos(xAngle)}
    // ];

    // let rotateZ = [
    //     {x: Math.cos(zAngle), y: -Math.sin(zAngle), z: 0},
    //     {x: Math.sin(zAngle), y: Math.cos(zAngle), z: 0},
    //     {x: 0, y: 0, z: 1}
    // ];
    //! END OF EXTRA MATRIXES


    let rotateY = 
    [
        {x:Math.cos(yAngle), y:-Math.sin(yAngle), z:0},
        {x:Math.sin(yAngle), y: Math.cos(yAngle), z:0},
        {x:0, y:0, z:1}

    ];

    let rotateX = 
    [
        {x:Math.cos(xAngle), y:0, z:-Math.sin(xAngle)},
        {x:0, y:1, z:0},
        {x:Math.sin(xAngle), y: 0, z:Math.cos(xAngle)}

    ];

    let rotateZ = 
    [
        {x:1, y:0, z:0},
        {x:0, y:Math.cos(zAngle), z:-Math.sin(zAngle)},
        {x:0, y:Math.sin(zAngle), z:Math.cos(zAngle)}

    ];

    let rotated = transform(rotateY, points);
    rotated = transform(rotateX, rotated);
    rotated = transform(rotateZ, rotated);

    return rotated;
}

function transform(transformationMatrix, matrix)
{

    // making new array of points that has sam length and struct so no
    // by ref errors
    let newPoints = [];

    // first row
    for(let i = 0; i < matrix.length; i++)
    {
        let point = matrix[i];

        let newX =
        transformationMatrix[0].x * point.x + 
        transformationMatrix[0].y * point.y +
        transformationMatrix[0].z * point.z;

        let newY =
        transformationMatrix[1].x * point.x + 
        transformationMatrix[1].y * point.y +
        transformationMatrix[1].z * point.z;

        let newZ =
        transformationMatrix[2].x * point.x + 
        transformationMatrix[2].y * point.y +
        transformationMatrix[2].z * point.z;

        let temp = {x: newX, y: newY, z: newZ};
        newPoints.push(temp);
    }

    return newPoints;
}