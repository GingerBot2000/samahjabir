const el = document.getElementById( 'board');
const ctx = el.getContext('2d');
let boardSize = 500;
el.width = boardSize;
el.height = boardSize;

let particles = [];
let particleIndex = 0;
let continu = true;
let mousePos = "x";

var mouse =
{
    x : 0,
    y : 0
}

window.onload = function()
{  
    animate();
}

window.addEventListener("keydown", keyPressed);
function keyPressed(event)
{
    // if(!continu)
    // {
    //     continu = true;
    //     animate();
    // }

    if(event.key == "x")
    {
        particles = [];
    }
    else
    {
        createParticle();
    }
}

window.addEventListener("mousemove", mousemovement);
function mousemovement(event)
{
    mouse.x = (event.offsetX - boardSize/2) / boardSize * 2;
    mouse.y = (event.offsetY - boardSize/2) / boardSize * -2;

    mousePos = mouse.x.toString() + " , " + mouse.y.toString();
    ctx.clearRect(0, 0, 200, 30);
    ctx.font = "16px courier";
    ctx.fillStyle = "red";
    ctx.fillText(mousePos, 5, 15); // top corner
}

function createParticle()
{
    let colours = ["#ef476f","#ffd166","#06d6a0","#118ab2","#073b4c"];
    particleIndex ++;
    let circle = 
    {
        index : particleIndex,
        colour : getRandomColour(colours),
        x : mouse.x,
        y : mouse.y,
        r : 10/boardSize, // so will be x pixels when rescaled
        xVel : (Math.random() - 0.5) * 0.1,
        yVel : (Math.random() - 0.5) * 0.1,
        xAccel : 0,
        yAccel : 0, //-0.01 ,
        dampingCoeff : 0.95,
    }
    particles.push(circle);
}

function draw()
{
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for(var i = 0; i < particles.length; i++)
    {
        let particle = particles[i];
        let r = particle.r * boardSize;
        let xPos = particle.x * boardSize/2 + boardSize/2;
        let yPos = particle.y * boardSize/-2 + boardSize/2;

        ctx.strokeStyle = particle.colour;
        ctx.fillStyle = particle.colour;
        ctx.beginPath();
        ctx.arc( xPos, yPos, r, 0, 2 * Math.PI, true );
        ctx.stroke();
        ctx.fill();

        // ctx.font = "16px courier";
        // ctx.fillStyle = "red";
        // ctx.fillText( particle.index, xPos, yPos); // top corner
    }
}

function update()
{
    // updating particle positions
    for(var i = 0; i < particles.length; i++)
    {
        let particle = particles[i];

        particle.xVel += particle.xAccel;
        particle.yVel += particle.yAccel;

        particle.x += particle.xVel;
        particle.y += particle.yVel;

        if(particle.x + particle.r >= 1)
        {
            particle.x = 1 - particle.r - 0.0001;
            particle.xVel *= -1 * particle.dampingCoeff;
        }
        else if(particle.x - particle.r <= -1)
        {
            particle.x = -1 + particle.r + 0.0001;
            particle.xVel *= -1 * particle.dampingCoeff;
        }

        if(particle.y + particle.r >= 1)
        {
            particle.y = 1 - particle.r;
            particle.yVel *= -1 * particle.dampingCoeff;
        }
        else if(particle.y <= -1)
        {
            particle.y = -1 + particle.r;
            particle.yVel *= -1 * particle.dampingCoeff;
            //console.log(particle);
        }

        if(collision(i))
        {
            particle.xVel *= -1;
            particle.yVel *= -1;
        }
    }
    
}

function animate()
{
    if(continu)
    {
        requestAnimationFrame(animate);
        update();
        draw();
    }
}

function getRandomColour(colours)
{
    let randomIndex = Math.floor(Math.random() * colours.length);
    let colour = colours[randomIndex];

    return colour;
}

function collision(index)
{
    let delta = 0.2;
    let initial = particles[index];
    for(let i = 0; i < particles.length; i++)
    {
        if(i != index)
        {
            let particle = particles[i];
            if((particle.x + delta >= initial.x) && (particle.x - delta <= initial.x) && (particle.y + delta >= initial.y) && (particle.y - delta <= initial.y))
            {
                let distance = (particle.x - initial.x)*(particle.x - initial.x) +
                (particle.y - initial.y)*(particle.y - initial.y);
                distance = Math.sqrt(distance);
                // console.log(distance, particle, initial);
                // continu = false;
                if(distance <= (particle.r + initial.r)*2) // multiply by 2 as from -1 to 1, double everythung else by 2
                {
                    return true
                }
            }
        }
    }

    return false;
}