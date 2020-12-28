define(['knockout', 'appController', 'ojs/ojmodule-element-utils', 'accUtils'],
		function(ko, app, moduleUtils, accUtils) {

	class DeviceManagerViewModel {
		constructor() {
			this.dispositivosConectados = ko.observableArray([]);
			this.caracteristicasSoportadas = ko.observableArray([]);
			
			this.menuCaracteristicas = ko.observableArray([
				{ audio: true },
				{ video: true },
				{ audio: true, video: true },
				{ video: { width: 500, height: 20 } },
				{ audio: true, video: { width: 1280, height: 720 } },
				{ audio: true, video : { facingMode : "user"} },
				{ audio: true, video : { facingMode : "environment"} },
				{ audio: true, video: { width: { exact : 128000} , height: { exact : 72000 } } },
			]);
			
			this.tracksDeAudio = ko.observableArray([]);
			this.tracksDeVideo = ko.observableArray([]);
			
			this.streamLocal = ko.observable();
			
			this.headerConfig = ko.observable({'view':[], 'viewModel' : null});
			
			var self = this;
			moduleUtils.createView({'viewPath':'views/header.html'}).
				then(function(view) {
					self.headerConfig({'view':view, 'viewModel': app.getHeaderModel()})
				});
		}

		connected() {
			accUtils.announce('DeviceManager page loaded.');
			document.title = "Gestor de dispositivos";
			
			this.cargarDispositivos();
		}	
		
		cargarDispositivos() {
			var self = this;
			navigator.mediaDevices.enumerateDevices().
				then(function(devices) { 
					self.dispositivosConectados([]);
					for (var i=0; i<devices.length; i++) {
						var theDevice = devices[i];
						theDevice.conectar = function() {
							self.buscarDispositivo(
								{
									video: { deviceId: this.deviceId }
								 }
							);
						}  
						self.dispositivosConectados.push(theDevice);
					}
				});
			var cs = navigator.mediaDevices.getSupportedConstraints();
			for (var field in cs)
				this.caracteristicasSoportadas.push({nombre : field, valor : cs[field]});
		}
		
		buscarDispositivo(caracteristicasBuscadas) {
			console.log(caracteristicasBuscadas);
			var self = this;
			navigator.mediaDevices.getUserMedia(caracteristicasBuscadas).
				then(function(stream) {
					//var widgetVideo = document.getElementById("widgetVideo");
					//widgetVideo.srcObject = stream;
					self.streamLocal(stream);
					self.inspeccionar(stream);
				});
		}
		
		inspeccionar(stream) {
			this.tracksDeAudio(stream.getAudioTracks());
			this.tracksDeVideo(stream.getVideoTracks());
		}
		
		detenerTodas() {
			for (var i=0; i<this.tracksDeAudio().length; i++)
				this.tracksDeAudio()[i].stop();
			for (var i=0; i<this.tracksDeVideo().length; i++)
				this.tracksDeVideo()[i].stop();
			var widgetVideo = document.getElementById("widgetVideo");
			widgetVideo.srcObject = null;
		}

		disconnected() {
			// Implement if needed
		};

		transitionCompleted() {
			// Implement if needed
		};
	}

	return DeviceManagerViewModel;
}
);










