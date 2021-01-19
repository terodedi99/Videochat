class Mensaje {
	constructor(texto, hora) {
		this.texto = texto;
		
		var today = new Date();
		
		this.hora = hora ? hora : today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	}
}