
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' + 
  'uniform mat4 u_projectionMatrix;\n' +
  'uniform mat4 u_viewMatrix;\n' +
  'uniform mat4 u_transformMatrix;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_projectionMatrix * u_viewMatrix * u_transformMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +  
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' + 
  'varying vec4 v_Color;\n' +    
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color + texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';
  

var eye = [0, 2.5, 0];
var up = [0, 1, 0];
var look = [0, 0, 5];
var fov = 120; 
var aspect = 1;
var near = 1;
var far = 100; 
var n = 36;
var perspectiveMatrix = new Matrix4();
var lookAtMatrix = new Matrix4();
var ground = new Matrix4();
var horizon = new Matrix4();
var worldCubes = new Matrix4();

var stone = new Image();
stone.src = './textures/stone.jpg';
var creamy = new Image();
creamy.src = './textures/creamy.jpg';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
  console.log('Failed to get the rendering context for WebGL');
  return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  console.log('Failed to intialize shaders.');
  return;
  }

  gl.enable(gl.DEPTH_TEST)

//CODE USED FROM MATSUDA CHAPTER 7 SAMPLE PROGRAM LookAtTraingles.js
//------------- -------------------------------------------------------
 

  var u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix');
  var u_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix');

  perspectiveMatrix.setPerspective(fov, aspect, near, far);
    lookAtMatrix.setLookAt(
    eye[0], eye[1], eye[2],
    eye[0]+look[0], eye[1]+look[1], eye[2]+look[2],
    up[0], up[1], up[2]
  );
  gl.uniformMatrix4fv(u_projectionMatrix, false, perspectiveMatrix.elements);
  gl.uniformMatrix4fv(u_viewMatrix, false, lookAtMatrix.elements);
//----------------------------------------------------------------------

  document.onkeydown = function(ev) {
    keydown(ev, gl, u_viewMatrix, lookAtMatrix);
    drawScene(gl)
  }
    
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  
  drawScene(gl);

}

function drawScene(gl) {
  drawGround(gl);
  drawSkyBox(gl);
  createWorld(gl);
}

function keydown(ev, gl, viewMatrix, lookAtMatrix) { 


  if (ev.keyCode == 87)  // w, forward
  { 
    eye[0] += 0.5 * look[0];
    eye[1] += 0.5 * look[1];
    eye[2] += 0.5 * look[2];
  } 

   else if (ev.keyCode == 83) //s, backward
   { 
    eye[0] -= 0.5 * look[0];
    eye[1] -= 0.5 * look[1];
    eye[2] -= 0.5 * look[2];
   } 
   else if (ev.keyCode == 68)  //d, rightward
   {

    var vec = crossProduct();
    vec = normalize(vec);
    eye[0] += .85 * vec[0];
    eye[1] += .85 * vec[1];
    eye[2] += .85 * vec[2];

   } 
  
   else if (ev.keyCode == 65)  //a, leftward
    { 
     var vec = crossProduct();
     vec = normalize(vec);
     eye[0] -= .85 * vec[0];
     eye[1] -= .85 * vec[1];
     eye[2] -= .85 * vec[2];
    }

  lookAtMatrix.setLookAt(
    eye[0], eye[1], eye[2],
    eye[0]+look[0], eye[1]+look[1], eye[2]+look[2],
    up[0], up[1], up[2]
  );
  gl.uniformMatrix4fv(viewMatrix, false, lookAtMatrix.elements);
}

function magnitude(vec) {
  
  return Math.sqrt(vec[0] * vec[0]) + (vec[1] * vec[1]) + (vec[2] * vec[2]);
}

function normalize(vec) {
   var mag = magnitude(vec);
   var normalized = [vec[0]/mag, vec[1]/mag, vec[2]/mag]; 
  return normalized;
}

function crossProduct() { 
  

 //CROSS PRODUCT FORMULA a2b3 - a3b2, a3b1 - a1b3, a1b2 - a2b1

 //a2b3 -a3b2
 var x = look[1] * up[2] - look[2] * up[1];
 //a3b1 - a1b3
 var y = look[2] * up[0] - look[0] * up[2];
 //a1b2 - a2b1
 var z = look[0] * up[1] - look[1] * up[0];
 return [x,y,z];
}

function initTextures(gl, vertices, name) {

  // Create a texture object
  var texture = gl.createTexture();   
  if (!texture) {
      console.log('Failed to create the texture object');
      return false;
  }
  
  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
      console.log('Failed to get the storage location of u_Sampler');
      return false;
  }

  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
      return false;
  }
  
  //loads the textures based on their name
  if(name == 'stone') {
    loadTexture(gl, vertices, texture, u_Sampler, stone);
  } else if(name == 'creamy') {
    loadTexture(gl, vertices, texture, u_Sampler, creamy);
  } 
  return true;
  }

function drawCube(gl, n) {
  //pass in transformation matrix and set
  gl.drawArrays(gl.TRIANGLES, 0, n)
}

function loadTexture(gl, vertices, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

function initVertexBuffers(gl, x, y, z, size, rgb){

   // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

  r = rgb[0]
  g = rgb[1]
  b = rgb[2]
  var vertices = new Float32Array( [
    
    //top 
    x-size, y+size, z+size, r, g, b,
    x+size, y+size, z+size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x+size, y+size, z+size, r, g, b,
    x+size, y-size, z+size, r, g, b,
    //left
    x-size, y+size, z-size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x-size, y-size, z-size, r, g, b,
    x-size, y-size, z-size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x+size, y-size, z-size, r, g, b,
    //right
    x-size, y+size, z+size, r, g, b,
    x-size, y+size, z-size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x-size, y+size, z-size, r, g, b,
    x-size, y-size, z-size, r, g, b,
    //front
    x+size, y+size, z+size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x+size, y-size, z+size, r, g, b,
    x+size, y-size, z+size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x+size, y-size, z-size, r, g, b,
    //back       
    x-size, y+size, z-size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x-size, y+size, z+size, r, g, b,
    x-size, y+size, z+size, r, g, b,
    x+size, y+size, z-size, r, g, b,
    x+size, y+size, z+size, r, g, b,
    //bottom         
    x-size, y-size, z-size, r, g, b,  
    x+size, y-size, z-size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x-size, y-size, z+size, r, g, b,
    x+size, y-size, z-size, r, g, b,
    x+size, y-size, z+size, r, g, b
  ]);

  
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var FSIZE = vertices.BYTES_PER_ELEMENT;
  
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
  
  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
  //console.log(vertices)

  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.disableVertexAttribArray(a_TexCoord);
  return n;
  //gl.drawArrays(gl.TRIANGLES, 0, n);

}

function initTexturedBuffers(gl){
  // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

   // SOME CODE USED DIRECTLY FROM MATSUDA CHAPTER 5 SAMPLE PROGRAM MultiAttributeColor.js
  //---------------------------------------------------------------------------------------------------------
  var vertices = new Float32Array( [
    // Top
    -1.0,  1.0, -1.0,    0, 0,
    -1.0,  1.0,  1.0,    0, 1,
     1.0,  1.0,  1.0,    1, 1,
     1.0,  1.0, -1.0,    1, 0,
    
    // Left 
    -1.0,  1.0,  1.0,    1, 1,
    -1.0, -1.0,  1.0,    1, 0,
    -1.0, -1.0, -1.0,    0, 0,
    -1.0,  1.0, -1.0,    0, 1,
 
    // Right 
     1.0,  1.0,  1.0,    1, 1,
     1.0, -1.0,  1.0,    1, 0,
     1.0, -1.0, -1.0,    0, 0,
     1.0,  1.0, -1.0,    0, 1,

    // Front
     1.0,  1.0,  1.0,    1, 1,
     1.0, -1.0,  1.0,    1, 0,
    -1.0, -1.0,  1.0,    0, 0,
    -1.0,  1.0,  1.0,    0, 1,

    // Back
     1.0,  1.0, -1.0,    1, 1,
     1.0, -1.0, -1.0,    1, 0,
    -1.0, -1.0, -1.0,    0, 0,
    -1.0,  1.0, -1.0,    0, 1,

    // Bottom
    -1.0, -1.0, -1.0,    1, 1,
    -1.0, -1.0,  1.0,    1, 0,
     1.0, -1.0,  1.0,    0, 0,
     1.0, -1.0, -1.0,    0, 1,
  ]);

  var indices = new Uint16Array( [
    0, 1, 2, 0, 2, 3, //front

    4, 5, 6, 4, 6, 7, //right
    
    8, 9, 10, 8, 10, 11, //up

    
    12, 13, 14, 12, 14, 15, //left

    
    16, 17, 18,  16, 18, 19, // Bottom

    
    20, 21, 22, 20, 22, 23 // Back
  ]);

  
 
  
  var vertexBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();

  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  if(!indexBuffer)
  {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);



  var FSIZE = vertices.BYTES_PER_ELEMENT;
  
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
  
  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  gl.disableVertexAttribArray(a_Color);
  gl.vertexAttrib4f(a_Color, 0, 0, 0, 0);

  return indices.length;
}
//END OF SAMPLE PROGRAM USAGE
//---------------------------------------------------------------------------------



function  createWorld(gl){
  var world = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], 
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0], 
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], 
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 2],
  ]                
  
  for( var i = 0; i < 32; i++) 
  {
    
    for( var j = 0; j < 32; j++) 
    {
      if (world[i][j] > 0)
       {
        var height = world[i][j];
        for (k = 1; k <= height; k++) 
        {
          var u_transformationMatrix = gl.getUniformLocation(gl.program, 'u_transformMatrix');
          n = initTexturedBuffers(gl, 0, 0, 0, 1);
          worldCubes.setScale(1, 1.5, 1)
          worldCubes.translate((16-j), k, (16-i));
          gl.uniformMatrix4fv(u_transformationMatrix, false, worldCubes.elements);
          if(((i+j + k) % 2) == 0) 
          {
            initTextures(gl, n, 'creamy');
          } else {
            initTextures(gl, n, 'stone');
          }
        }
      }
    }
  }
}

function drawSkyBox(gl){
  var u_transformationMatrix = gl.getUniformLocation(gl.program, 'u_transformMatrix');
  n = initVertexBuffers(gl, 0, 0, 0, 1, [0, 1, 1]);
  horizon.setScale(64, 128, 64);
  gl.uniformMatrix4fv(u_transformationMatrix, false, horizon.elements);
  drawCube(gl, n);
}
function drawGround(gl){
  var u_transformationMatrix = gl.getUniformLocation(gl.program, 'u_transformMatrix');
  n = initVertexBuffers(gl, 0, 0, 0, 1, [1, 1, 0]);
  ground.setScale(128, 0, 128);
  gl.uniformMatrix4fv(u_transformationMatrix, false, ground.elements);
  drawCube(gl, n);
}



