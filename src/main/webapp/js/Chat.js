class Chat {
	constructor(ko, user) {
		let self = this;
		this.ko = ko;
		
		this.estado = ko.observable("");
		this.error = ko.observable();
		this.user = user;
		this.usuarios = ko.observableArray([]);
		this.llamadasEntrantes = ko.observableArray([]);
		this.llamadasEntrantes.push("Isma");
		this.mensajesRecibidos = ko.observableArray([]);
		this.conversaciones = ko.observableArray([]);
		
		this.destinatario = ko.observable();
		this.mensajeQueVoyAEnviar = ko.observable();
		this.personaABuscar = ko.observable();

		this.mensajesRecuperados = ko.observableArray([]);
		this.chat = new WebSocket("wss://" + window.location.host + "/wsTexto");
		
		this.chat.onopen = function() {
			self.estado("Conectado al chat de texto");
			self.error("");
		}

		this.chat.onerror = function() {
			self.estado("");
			self.error("Chat de texto cerrado");
		}

		this.chat.onclose = function() {
			self.estado("");
			self.error("Chat de texto cerrado");
		}
		
	
		this.chat.onmessage = function(event) {
			var data = JSON.parse(event.data);
			if (data.type == "FOR ALL") {
				var mensaje = new Mensaje(data.message, data.time);
				this.mensajesRecibidos.push(mensaje);
			} else if (data.type == "ARRIVAL") {
				self.addUsuario(data.userName, data.picture);
//				var usuario = new Usuario(data.userName, data.picture);
//				self.usuarios.push(usuario);
			} else if (data.type == "LLAMAR") {
				self.addLlamadaEntrante(data.userName, data.picture);
				self.mensajesRecibidos.push("En teoria se ha metido");
//				var usuario = new Usuario(data.userName, data.picture);
//				self.usuarios.push(usuario);
			} else if (data.type == "BYE") {
				var userName = data.userName;
				for (var i=0; i<self.usuarios().length; i++) {
					if (self.usuarios()[i].nombre == userName) {
						self.usuarios.splice(i, 1);
						break;
					}
				}
			} else if (data.type == "PARTICULAR") {
				var conversacionActual = self.buscarConversacion(data.remitente);
				if (conversacionActual!=null) {
					var mensaje = new Mensaje(data.message.message, data.message.time);
					conversacionActual.addMensaje(mensaje);
				} else {
					conversacionActual = new Conversacion(ko, data.remitente, self);
					var mensaje = new Mensaje(data.message.message, data.message.time);
					conversacionActual.addMensaje(mensaje);
					self.conversaciones.push(conversacionActual);
				}
				self.ponerVisible(data.remitente);
			} 
		}
	}
	
	close() {
		this.chat.close();
	}
	
	cortarLlamada(){
		
	}
	
	recuperarMensajes(){
		let self = this;
		self.mensajesRecuperados([]);
		
		console.log("Sender:" +this.user().name + ", Recipient: " + this.personaABuscar())
		//self.message("Has pulsado recuperar mensajes de: " + self.personaABuscar);
		var info = {
			sender: this.user().name,
			recipient : this.personaABuscar()
			
		};
		var data = {
			data : JSON.stringify(info),
			url : "users/recuperarMensajes",
			type : "post",
			contentType : 'application/json',
			success : function(response) {
				console.log("Buena maquina");
				if(response.length == 0){
					window.alert("No se han encontrado conversaciones con ese usuario");
				} else{
					for (var i=0; i<response.length; i++){
						var dateComplete = new Date(response[i].date);
						response[i].date = dateComplete.getDate() + "/" + (dateComplete.getMonth() + 1) + "/" + dateComplete.getFullYear();
						self.mensajesRecuperados.push(response[i]);
					}
				}
			},
			error : function(response) {
				alert("Error: "/* + response.responseJSON.error*/);
			}
		};
		$.ajax(data);
	}
	
	enviar(mensaje) {
		this.chat.send(JSON.stringify(mensaje));
	}
	
	enviarATodos(mensaje) {
		var mensajeB = {
			type : "BROADCAST",
			message : this.mensajeQueVoyAEnviar()
		};
		this.chat.send(JSON.stringify(mensajeB));
	}
	
	buscarConversacion(nombreInterlocutor) {
		for (var i=0; i<this.conversaciones().length; i++) {
			if (this.conversaciones()[i].nombreInterlocutor==nombreInterlocutor)
				return this.conversaciones()[i];
		}
		return null;
	}
	
	setDestinatario(interlocutor) {
		this.destinatario(interlocutor);
		var conversacion = this.buscarConversacion(interlocutor.nombre);
		if (conversacion==null) {
			conversacion = new Conversacion(this.ko, interlocutor.nombre, this);
			this.conversaciones.push(conversacion);
		}
		this.ponerVisible(interlocutor.nombre);
	}
	
	ponerVisible(nombreInterlocutor) {
		for (var i=0; i<this.conversaciones().length; i++) {
			var conversacion = this.conversaciones()[i];
			conversacion.visible(conversacion.nombreInterlocutor == nombreInterlocutor);
		}
	}
	
	addUsuario(userName, picture) {
		var añadir = true;
		for(var i = 0; i < this.usuarios().length; i++){
			if (this.usuarios()[i].nombre == userName){
				añadir = false;
			}
		}
		if (añadir){
			this.usuarios.push(new Usuario(userName, picture));			
		}
	}
	
	addLlamadaEntrante(userName, picture){
		this.llamadasEntrantes.push(userName);}
}
	