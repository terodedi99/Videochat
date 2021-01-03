class VideoChat {
	constructor(ko) {
		let self = this;
		this.ko = ko;
		
		this.videoLocalOn = false;
		
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
				} catch (error) {
					self.addMensaje(error, "red");
				}
				return;
			}
			if (data.type=="ANSWER") {
				let sessionDescription = data.sessionDescription;
				let rtcSessionDescription = new RTCSessionDescription(sessionDescription);
				self.addMensaje("Añadiendo sessionDescription a la remoteDescription", "orange");
				self.conexion.setRemoteDescription(rtcSessionDescription);
				self.addMensaje("sessionDescription añadida a la remoteDescription", "orange");
// if (!this.videoLocalOn)
// this.encenderVideoLocal();
				return;
			}
		}
	}
	
	anunciarLlamada(remitente, sessionDescription) {
		this.addMensaje("Se recibe llamada de " + remitente + " con su sessionDescription", "black");
		let rtcSessionDescription = new RTCSessionDescription(sessionDescription);
		this.conexion.setRemoteDescription(rtcSessionDescription);
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
								type : "LLAMAR",
								sessionDescription : sessionDescription
							};
							self.ws.send(JSON.stringify(msg));
							self.addMensaje("Vamos a intentar meterlo");
						}
					);
				},
				function(error) {
					self.addMensaje("Error al crear oferta en el servidor Stun: " + error, "red");
				},
				sdpConstraints
			);
//		let msg = {
//				type : "LLAMAR",
//				sessionDescription : sessionDescription
//			};
//		self.ws.send(JSON.stringify(msg));
//		let aceptar = window.confirm("Te llama " + remitente + ". ¿Contestar?\n");
//		if (aceptar){
//			this.encenderVideoLocal();
//			this.aceptarLlamada(remitente, sessionDescription);
//		}
//		else
//			this.rechazarLlamada(remitente, sessionDescription);			
	}
	
	aceptarLlamada(remitente, sessionDescription) {
	
		this.encenderVideoLocal();
		this.crearConexion();
			
		
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
							sessionDescription : sessionDescription
						};
						self.ws.send(JSON.stringify(msg));
						self.addMensaje("Respuesta enviada al servidor de Signaling");
					}
				);
			},
			function(error) {
				self.addMensaje("Error al crear oferta en el servidor Stun: " + error, "red");
			},
			sdpConstraints
		);
	}
	
	rechazarLlamada(remitente, sessionDescription) {
		this.addMensaje("Llamada de " + remitente + " rechazada");
		this.addMensaje("Implementar función rechazarLlamada", "red");
	}
	
	encenderVideoLocal() {
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
			}, 
			function(error) {
				self.addMensaje("Error al cargar vídeo local: " + error, "red");
			}
		);
		self.crearConexion();
		
	}
	
	crearConexion() {
		let self = this;
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
		this.conexion = new RTCPeerConnection(servers);
		this.addMensaje("RTCPeerConnection creada");
		
		this.addMensaje("Asociando pistas locales a la RTCPeerConnection");
		//this.encenderVideoLocal();
		let localTracks = this.localStream.getTracks();
		localTracks.forEach(track =>
			{
				this.conexion.addTrack(track, this.localStream);
			}
		);
		
		this.conexion.onicecandidate = function(event) {
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
		
		this.conexion.oniceconnectionstatechange = function(event) {
			self.addMensaje("self.conexion.oniceconnectionstatechange: " + self.conexion.iceConnectionState, "DeepPink");
		}
			
		this.conexion.onicegatheringstatechange = function(event) {
			self.addMensaje("self.conexion.onicegatheringstatechange: " + self.conexion.iceGatheringState, "DeepPink");
		}
		
		this.conexion.onsignalingstatechange = function(event) {
			self.addMensaje("self.conexion.onsignalingstatechange: " + self.conexion.signalingState, "DeepPink");
		}
	
		this.conexion.onnegotiationneeded = function(event) {
			self.addMensaje("Negociación finalizada: self.conexion.onnegotiationneeded", "black");
			self.addMensaje("Listo para enviar oferta", "black");
		}
			
		this.conexion.ontrack = function(event) {
			self.addMensaje("Asociando pistas remotas a la RTCPeerConnection");
			let widgetVideoRemoto = document.getElementById("widgetVideoRemoto");
			widgetVideoRemoto.srcObject = event.streams[0];
			self.addMensaje("Vídeo remoto conectado");
		}
		
		this.conexion.onremovetrack = function(event) {
			self.addMensaje("self.conexion.onremovetrack");
		}
	}	
	crearOffer(self){
		self.conexion.createOffer(
				function(sessionDescription) {
					let self = this;
					self.addMensaje("sessionDescription recibida del servidor Stun");
					self.conexion.setLocalDescription(sessionDescription);
					self.addMensaje("sessionDescription enlazada a la RTCPeerConnnection local");
					self.addMensaje("Enviando oferta a " + destinatario + " mediante el servidor de Signaling");
					let msg = {
						type : "OFFER",
						sessionDescription : sessionDescription,
						recipient : destinatario
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
		this.addMensaje("Creando oferta en el servidor Stun");
		this.encenderVideoLocal();
		//setTimeout(self.crearConexion,3000);
		this.conexion.createOffer(
				function(sessionDescription) {
					//let self = this;
					self.addMensaje("sessionDescription recibida del servidor Stun");
					self.conexion.setLocalDescription(sessionDescription);
					self.addMensaje("sessionDescription enlazada a la RTCPeerConnnection local");
					self.addMensaje("Enviando oferta a " + destinatario + " mediante el servidor de Signaling");
					let msg = {
						type : "OFFER",
						sessionDescription : sessionDescription,
						recipient : destinatario
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

	addMensaje(texto, color) {
		let mensaje = {
			texto : texto,
			color : color ? color : "blue"
		};
		this.mensajes.push(mensaje);
	}
}