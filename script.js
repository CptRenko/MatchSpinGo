// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

let t, bombOne;
let textoPuente, cuadrante;
let start  = true;
let indice = -1;
let contadorColision = 0;
let indiceColindante = 0;
let arrPos = [];
let isMoving = false;
let cuadranteAnterior = -1;
//let cuadrante = -1;
let threshold = 20;
let positions = new Array();
let angulo = 0; //Detección del angulo. Evita que el jugador quede *totalmente* imposibilitado de volver al bloque anterior, desbloqueando el sistema en caso de que haya una rotación
//del bloque en donde esta

let Vec = function(x,y) {
	this.x = x;
	this.y = y;
}

let pos = new Vec(0,0);
//let 

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.
	
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
	runtime.addEventListener("afterprojectstart", () => AfterProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Code to run just before 'On start of layout' on
	// the first layout. Loading has finished and initial
	// instances are created and available to use here.
	
	
	runtime.addEventListener("tick", () => Tick(runtime));
		
	//Adjuntamos la funcion Setear a cada layout del proyecto, en el evento afterlayoutstart
	let layouts = runtime.getAllLayouts();
	
	for(let i = 0; i < layouts.length; i++)
	{
		layouts[i].addEventListener("afterlayoutstart", () => Setear(runtime));
	}
	
	//textoPuente.text = "No hay colision";
}

async function AfterProjectStart(runtime)
{
	
	
}

async function Setear(runtime)
{
	console.log("Seteo");
	//Adjuntamos a las losas, el borde que nos servia para hacer de colisión y detectar los caminos que se conecten y desplazar al jugador.
	t = runtime.objects.Terrains.getAllInstances();
	bombOne = runtime.objects.Bombs1.getAllInstances();
	textoPuente = runtime.objects.DebugColisionPuente.getFirstInstance();
	
	
	for(let i = 0; i < bombOne.length; i++)
	{
		//La cantidad de bombas (nuestra colision) es igual a la cantidad de losetas que hay.
		t[i].addChild(bombOne[i], {transformX: true, transformY: true, transformAngle: true, destroyWithParent: true});
	
		//DEBUG CODE
		if(t[i].uid === parseInt(runtime.globalVars.CuadranteJugador))
		{
			console.log("Detectado");
		}
	}
	
	cuadrante = runtime.globalVars.CuadranteJugador;
	cuadranteAnterior = cuadrante;
	
	
}

async function Tick(runtime)
{
	//Aca el proyecto ya esta cargando, por lo que el jugador ya esta en un cuadrante, y ya obtuvimos su  UID.
	//Por lo tanto, tenemos que buscar si el puente de dicho  esta colisionando con algun otro puente para poder cruzar.
	//En el caso que hayan 2 colisiones, determinamos al azar por el cual moverse.
	//De momento, esto lo hacemos en el Tick.
		
	let pj = runtime.objects.Personaje.getFirstInstance();
	let deltaTime = runtime.dt;
	
	//Necesito comprobar si hay algun bloque rotandose, para no activar porque hay dramas con las colision
	for(let l = 0; l < t.length; l++)
	{
		if(t[l].instVars.rotating)
		{
			start = false;
			break;
		}
		else
		{
			start = true;
		}
	}
	
	//Necesito determinar el indice del cuadrante en el que esta el jugador actual
	if(start)
	{
		contadorColision = 0;
		for(let j = 0; j < t.length; j++)
		{
			if(t[j].uid === parseInt(cuadrante))
			{
				indice = j;
				break;
			}
			
			//console.log(t[j].instVars.rotating);
		}
		
		//Determinado el indice, comprobamos con cuantos puente colisiona el de este bloque.
		//Y guardamos el indice del bloque colindante (que es = a la loza).
		for(let k = 0; k < t.length; k++)
		{
			if(t[indice].getChildAt(0).testOverlap(t[k].getChildAt(0)))
			{
				console.log("Overlap");
				contadorColision++;
				indiceColindante = k;
				isMoving = false;
				start = false;
				break;
			}
			
		}
	}
	

	//Hotfix: Si el angulo del bloque se ha movido, entonces anulamos el bloqueo del cuadrante anterior. Evitamos que el jugador se quede atrapado en algun escenario
	if(angulo != t[indice].angle)
	{
		cuadranteAnterior = -1;
	}
	
	//Solo se va a mover el PJ cuando:
	// - Hay mas de 1 colision
	// - El bloque a mover no sea el mismo del cual se movio, A MENOS QUE, el bloque anterior se haya movido de su angulo
	// - HOTFIX: No haya ningun bloque en estado de rotación
	if(contadorColision > 0 && !isMoving && t[indiceColindante].uid != cuadranteAnterior && !t[indice].instVars.rotating)
	{
		if(contadorColision == 1)
		{
			pos.x = t[indiceColindante].x;
			pos.y = t[indiceColindante].y;
			
			let pMove = 0; //¿Cuanto vamos a mover el PJ?
			
			if(parseInt(pj.x) === parseInt(pos.x))
			{
				moveTo = "Y";
			}
			else if(parseInt(pj.y) === parseInt(pos.y))
			{
				moveTo = "X";
			}
			
			//Determinamos cuanto debemos mover y lo agregamos al array
			
			if(moveTo ==="X")
			{
				pMove = pos.x - pj.x;
				positions.push(pMove);
			}
			else if(moveTo === "Y")
			{
				pMove = pos.y - pj.y;
				positions.push(pMove);
				
			}
			cuadranteAnterior = cuadrante;
			isMoving = true;
		}
	}
	
	do
	{
		//@TODO: Agregar delta time
		if(moveTo === "X")
		{
			pj.x += positions[0];
		}
		else if(moveTo === "Y")
		{
			pj.y += positions[0];
		}
		
		//Determinamos si esta en el centro, O, dentro de un threshold determinado
		if((parseInt(pos.x) === parseInt(pj.x) && parseInt(pos.y) === parseInt(pj.y) && isMoving))
		{
			console.log("Moviendose");
			isMoving = false;
			positions.shift();
			
			start = true;
		
			//Detectamos en que cuadrante esta el personaje.
			for(let k = 0; k < t.length; k++)
			{
				pos.x = t[k].x;
				pos.y = t[k].y;

				if(parseInt(pos.x) === parseInt(pj.x) && parseInt(pos.y) === parseInt(pj.y))
				{
					cuadrante = t[k].uid;
					angulo = t[k].angle;
					break;
				}
			}
		}
	}
	while(isMoving);
}