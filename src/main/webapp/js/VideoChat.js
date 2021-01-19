class VideoChat {
	constructor(ko) {
		let self = this;
		this.ko = ko;
		
		this.videoLocalOn = false;
		this.destinatario = "";
		this.UnaSessionDescription = ""; 
		this.mensajes = ko.observableArray([]);
		
		this.estado = ko.observable("No conectado");
		this.error = ko.observable();
		
		this.ws = new WebSocket("wss://" + window.location.host + "/wsSignaling");
		
		this.ws.onopen = function() {
			self.estado("Conectado al servidor de signaling");
			self.error("");
			self.addMensaje("Conectado al servidor de signaling", "green");
		}
		
		this.ws.onerror = function() {
			self.estado("");
			self.error("Desconectado del servidor de signaling");
			self.addMensaje("Desconectado del servidor de signaling", "red");
		}
		
		this.ws.onclose = function() {
			self.estado("");
			self.error("Desconectado del servidor de signaling");
			self.addMensaje("Desconectado del servidor de signaling", "red");
		}

		this.ws.onmessage = function(event) {
			var data = JSON.parse(event.data);
			if (data.type=="OFFER") {
				self.anunciarLlamada(data.remitente, data.sessionDescription);
				return;
			}
			if (data.type=="CANDIDATE" && data.candidate) {
				self.addMensaje("Recibido candidato desde Signaling", "blue");
				try {
					self.conexion.addIceCandidate(data.candidate);
					self.addMensaje("Añadido candidato desde Signaling", "blue");
				} catch (error) {
					self.addMensaje(error, "red");
				}
				return;
			}


			if (data.type=="ANSWER") {

				var localVideo = document.getElementById("widgetVideoLocal");
				var remoteVideo = document.getElementById("widgetVideoRemoto");
				if (data.valor == "YES"){
					remoteVideo.setAttribute("style", "display: visible");
					localVideo.setAttribute("style", "display: visible");
					let sessionDescription = data.sessionDescription;
					let rtcSessionDescription = new RTCSessionDescription(sessionDescription);
					self.addMensaje("Añadiendo sessionDescription a la remoteDescription", "orange");
					self.conexion.setRemoteDescription(rtcSessionDescription);
					self.addMensaje("sessionDescription añadida a la remoteDescription", "orange");
					return;
				}
				if (data.valor == "NO"){
					
					remoteVideo.setAttribute("style", "display: none");
					localVideo.setAttribute("style", "display: none");
					window.alert("Llamada rechazada");
					
					setTimeout(function(){ self.conexion.close; }, 3000);
					
				}
			}
		}
		if (!this.videoLocalOn)
			this.encenderVideoLocal(this.crearConexion);
		
	}
	
	anunciarLlamada(remitente, sessionDescription) {
		this.addMensaje("Se recibe llamada de " + remitente + " con su sessionDescription", "black");
		this.UnaSessionDescription = sessionDescription;
	}
	
	aceptarLlamada(remitente) {
		let sessionDescription = this.UnaSessionDescription;
		let rtcSessionDescription = new RTCSessionDescription(sessionDescription);
		this.addMensaje("Añadiendo sessionDescription a la remoteDescription", "grey");
		this.conexion.setRemoteDescription(rtcSessionDescription);
		this.addMensaje("sessionDescription añadida a la remoteDescription", "grey");
					
		this.addMensaje("Llamada aceptada", "black");
		this.addMensaje("Creando respuesta mediante el servidor Stun");
		
		let sdpConstraints = {};
		let self = this;
		this.conexion.createAnswer(
			function(sessionDescription) {
				self.addMensaje("sessionDescription recibida del servidor stun");
				self.conexion.setLocalDescription(sessionDescription).then(
					function() {
						self.addMensaje("sessionDescription enlazada a la RTCPeerConnnection local");
						self.addMensaje("Enviando aceptación al servidor de Signaling");
						let msg = {
							type : "ANSWER",
							valor : "YES",
							sessionDescription : sessionDescription
						};
						self.ws.send(JSON.stringify(msg));
						self.addMensaje("Respuesta enviada al servidor de Signaling");
						var localVideo = document.getElementById("widgetVideoLocal");
						localVideo.setAttribute("style", "display: visible");
						var remoteVideo = document.getElementById("widgetVideoRemoto");
						remoteVideo.setAttribute("style", "display: visible");	
						
						
					}
				);
			},
			function(error) {
				self.addMensaje("Error al crear oferta en el servidor Stun: " + error, "red");
			},
			sdpConstraints
		);
	}
	

	rechazarLlamada(remitente) {
		this.addMensaje("Llamada de " + remitente + " rechazada");
		let sessionDescription = this.UnaSessionDescription;
		let rtcSessionDescription = new RTCSessionDescription(sessionDescription);
		this.conexion.setRemoteDescription(rtcSessionDescription);
		
		let sdpConstraints = {};
		let self = this;
		this.conexion.createAnswer(
			function(sessionDescription) {
				self.conexion.setLocalDescription(sessionDescription).then(
					function() {
						let msg = {
							type : "ANSWER",
							valor : "NO",
							remitente : remitente,
							sessionDescription : sessionDescription
						};
						self.ws.send(JSON.stringify(msg));
						self.addMensaje("Respuesta enviada al servidor de Signaling");
						var remoteVideo = document.getElementById("widgetVideoRemoto");
						remoteVideo.setAttribute("style", "display: none");	
						var localVideo = document.getElementById("widgetVideoLocal");
						localVideo.setAttribute("style", "display: none");
						
					}
				);
			},
			function(error) {
				self.addMensaje("Error al crear oferta en el servidor Stun: " + error, "red");
			},
			sdpConstraints
		);
	}
	
	
	encenderVideoLocal(callback) {
		let self = this;
		
		let constraints = {
			video : true,
			audio : false
		};
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		navigator.getUserMedia(
			constraints, 
			function(stream) {
				let widgetVideoLocal = document.getElementById("widgetVideoLocal");
				self.localStream = stream;
				widgetVideoLocal.srcObject = stream;
				self.videoLocalOn = true;
				self.addMensaje("Vídeo local conectado", "green");
				callback(self, self.crearOffer);
			}, 
			function(error) {
				self.addMensaje("Error al cargar vídeo local: " + error, "red");
			}
		);
		
	}
	
	crearConexion(self, callback) {
		// let self = this;
		let servers = { 
			iceServers : [ 
				// { "url" : "stun:stun.1.google.com:19302" }
				{ 
					urls : "turn:localhost",
					username : "webrtc",
					credential : "turnserver"
				}
			]
		};
		self.conexion = new RTCPeerConnection(servers);
		self.addMensaje("RTCPeerConnection creada");
		
		self.addMensaje("Asociando pistas locales a la RTCPeerConnection");
		// this.encenderVideoLocal();
		let localTracks = self.localStream.getTracks();
		localTracks.forEach(track =>
			{
				self.conexion.addTrack(track, self.localStream);
			}
		);
		
		self.conexion.onicecandidate = function(event) {
			if (event.candidate) {
				self.addMensaje("self.conexion.onicecandidate (<i>recibido candidate desde el Stun</i>)");
				let msg = {
					type : "CANDIDATE",
					candidate : event.candidate
				};
				self.ws.send(JSON.stringify(msg));
				self.addMensaje("Candidate enviado al servidor de Signaling");
			}  else {
				self.addMensaje("Recibidos todos los candidates desde el Stun");
			}
		}
		
		self.conexion.oniceconnectionstatechange = function(event) {
			self.addMensaje("self.conexion.oniceconnectionstatechange: " + self.conexion.iceConnectionState, "DeepPink");
		}
			
		self.conexion.onicegatheringstatechange = function(event) {
			self.addMensaje("self.conexion.onicegatheringstatechange: " + self.conexion.iceGatheringState, "DeepPink");
		}
		
		self.conexion.onsignalingstatechange = function(event) {
			self.addMensaje("self.conexion.onsignalingstatechange: " + self.conexion.signalingState, "DeepPink");
		}
	
		self.conexion.onnegotiationneeded = function(event) {
			self.addMensaje("Negociación finalizada: self.conexion.onnegotiationneeded", "black");
			self.addMensaje("Listo para enviar oferta", "black");
		}
			
		self.conexion.ontrack = function(event) {
			self.addMensaje("Asociando pistas remotas a la RTCPeerConnection");
			let widgetVideoRemoto = document.getElementById("widgetVideoRemoto");
			widgetVideoRemoto.srcObject = event.streams[0];
			self.addMensaje("Vídeo remoto conectado");
		}
		
		self.conexion.onremovetrack = function(event) {
			self.addMensaje("self.conexion.onremovetrack");
		}
		var localVideo = document.getElementById("widgetVideoLocal");
		localVideo.setAttribute("style", "display: none");
		// callback(self);
	}	
	
	// Ahora mismo no se usa
	crearOffer(self){
		let sdpConstraints = {};
		self.conexion.createOffer(
				function(sessionDescription) {
// let self = this;
					self.addMensaje("sessionDescription recibida del servidor Stun");
					self.conexion.setLocalDescription(sessionDescription);
					self.addMensaje("sessionDescription enlazada a la RTCPeerConnnection local");
					self.addMensaje("Enviando oferta a " + self.destinatario + " mediante el servidor de Signaling");
					let msg = {
						type : "OFFER",
						sessionDescription : sessionDescription,
						recipient : self.destinatario
					};
					self.ws.send(JSON.stringify(msg));
					self.addMensaje("Oferta enviada al servidor de signaling");

				},
				function(error) {
					self.addMensaje("Error al crear oferta en el servidor Stun", true);
				},
				sdpConstraints
			);
	}
	
	enviarOferta(destinatario) {
		let self = this;
		let sdpConstraints = {};
		this.destinatario = destinatario.nombre;
		this.addMensaje("Creando oferta en el servidor Stun");
		this.conexion.createOffer(
				function(sessionDescription) {
					self.addMensaje("sessionDescription recibida del servidor Stun");
					self.conexion.setLocalDescription(sessionDescription);
					self.addMensaje("sessionDescription enlazada a la RTCPeerConnnection local");
					self.addMensaje("Enviando oferta a " + destinatario.nombre + " mediante el servidor de Signaling");
					let msg = {
						type : "OFFER",
						sessionDescription : sessionDescription,
						recipient : destinatario.nombre
					};
					self.ws.send(JSON.stringify(msg));
					self.addMensaje("Oferta enviada al servidor de signaling");
					//viewModel.chat().llamada(destinatario);
				},
				function(error) {
					self.addMensaje("Error al crear oferta en el servidor Stun", true);
				},
				sdpConstraints
			);
		
		
	}

	addMensaje(texto, color) {
		let mensaje = {
			texto : texto,
			color : color ? color : "blue"
		};
		this.mensajes.push(mensaje);
	}
}