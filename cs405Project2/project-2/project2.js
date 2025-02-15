
/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 * 		setMesh, draw, setAmbientLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.normbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */

		this.isLightingEnabled = false;  // Initially, lighting is disabled
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.lightPos = [0.0, 0.0, 0.0]; 

		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.ambient = 0.2; 

		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
			
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		 // Bind and set normal coordinates data
		 this.normbuffer = gl.createBuffer();
		 gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
	 
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		// Pass lighting uniforms
		gl.uniform3fv(this.lightPosLoc, this.lightPos);
		gl.uniform1f(this.ambientLoc, this.ambient);
		gl.uniform1i(this.enableLightingLoc, this.isLightingEnabled ? 1 : 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		
		// Update light position based on keyboard input
		updateLightPos();
		this.lightPos = [lightX, lightY, this.lightPos[2]];

			
		var lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
    	gl.uniform3f(lightPosLoc, lightX, lightY, 0.0);  

		// Pass lighting uniforms
		gl.uniform3fv(this.lightPosLoc, this.lightPos);
		gl.uniform1f(this.ambientLoc, this.ambient);
		gl.uniform1i(this.enableLightingLoc, this.isLightingEnabled ? 1 : 0);

	
		// Set normal attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		// Set the texture image data
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	
		// Set texture parameters
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			// Only generate mipmaps for power-of-2 textures
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			// implemented logic for non power of two textures:
			// CLAMP_TO_EDGE 
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		// Update the lighting state based on the input
		this.isLightingEnabled = show;
	}
	
	
	setAmbientLight(ambientIntensity) {
		this.ambient = ambientIntensity;
	}
	
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
		precision mediump float;

		uniform bool showTex;
		uniform bool enableLighting;
		uniform sampler2D tex;
		uniform vec3 color; 
		uniform vec3 lightPos;
		uniform float ambient;

		varying vec2 v_texCoord;
		varying vec3 v_normal;

		void main() {
			vec3 norm = normalize(v_normal);
			vec3 lightDir = normalize(lightPos - vec3(gl_FragCoord));
			float diff = max(dot(norm, lightDir), 0.0);
		
			vec4 texColor = texture2D(tex, v_texCoord);
			vec4 ambientColor = vec4(ambient, ambient, ambient, 1.0) * texColor;
			vec4 diffuseColor = vec4(diff, diff, diff, 1.0) * texColor;
		
			if (showTex && enableLighting) {
				gl_FragColor = ambientColor + diffuseColor;
			}
			else if (showTex) {
				gl_FragColor = texColor;
			}
			else {
				gl_FragColor = vec4(color, 1.0);
			}
		}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
    const translationSpeed = 10; 
    if (keys['ArrowUp']) lightY += translationSpeed;
    if (keys['ArrowDown']) lightY -= translationSpeed;
    if (keys['ArrowRight']) lightX += translationSpeed;
    if (keys['ArrowLeft']) lightX -= translationSpeed;
	console.log('Light Position:', lightX, lightY);
}

///////////////////////////////////////////////////////////////////////////////////