class Conversacion {
	constructor(ko, nombreInterlocutor, chat) {
		this.nombreInterlocutor = nombreInterlocutor;
		this.mensajes = ko.observableArray([]);
		this.textoAEnviar = ko.observable("");
		this.chat = chat;
		this.visible = ko.observable(true);
	}
	
	addMensaje(mensaje) {
		this.mensajes.push(mensaje);
	}
	
	enviar() {
		var mensaje = {
			type : "PARTICULAR",
			destinatario : this.nombreInterlocutor,
			texto : this.textoAEnviar()
		};
		this.chat.enviar(mensaje);
		var mensaje = new Mensaje(this.textoAEnviar());
		this.addMensaje(mensaje);
	}
	
	llamar(sender) {
		var mensaje = {
			type : "LLAMAR",
			remitente: sender,
			destinatario : this.nombreInterlocutor,
		};
		this.chat.enviar(mensaje);
	}
}