define(['knockout', 'appController', 'ojs/ojmodule-element-utils', 'accUtils'],
		function(ko, app, moduleUtils, accUtils) {

	function ChatViewModel() {
		var self = this;
		
		this.user = app.user;
		
		self.recipient = ko.observable();

		self.chat = ko.observable(new Chat(ko, this.user));
		
		self.videoChat = ko.observable(new VideoChat(ko));

		self.estadoChatDeTexto = self.chat().estado;
		self.estadoSignaling = self.videoChat().estado;
		self.errorChatDeTexto = self.chat().error;
		self.errorSignaling = self.videoChat().error;

		// Header Config
		self.headerConfig = ko.observable({'view':[], 'viewModel':null});
		moduleUtils.createView({'viewPath':'views/header.html'}).then(function(view) {
			self.headerConfig({'view':view, 'viewModel': app.getHeaderModel()})
		})

		
		self.connected = function() {
			accUtils.announce('Chat page loaded.');
			document.title = "Chat";

			getUsuariosConectados();

		};

		function getUsuariosConectados() {
			var data = {	
				url : "users/getNombresUsuariosConectados",   // array de String
				type : "get",
				contentType : 'application/json',
				success : function(response) {
					for (var i=0; i<response.length; i++) {
						var user = {
								nombre : response[i],
								picture : ko.observable(null)
						};
						//var userName = response[i].name;
						//var picture = response[i].picture;
						self.chat().addUsuario(user.nombre, user.picture);
						loadPicture(user);
					}
				},
				error : function(response) {
					self.error(response.responseJSON.error);
				}
			};
			$.ajax(data);
		}
	
		function loadPicture(user) {
			
			var info = {
					userName: user.nombre,					
				};
			
			var data = {	
					data : JSON.stringify(info),
					url : "users/getPicture", 
					type : "post",
					contentType : 'application/json',
					success : function(response) {
						user.picture(response);
					},
					error : function(response) {
						self.error(response.responseJSON.error);
					}
				};
				$.ajax(data);
//			
//			var data = {
//				url ^"uses/getPicture/"del user.name,
//				user.picture(response)
//			}
		}
		
		self.encenderVideoLocal = function() {
			self.videoChat().encenderVideoLocal();
		}
		
		self.crearConexion = function() {
			self.videoChat().crearConexion();
		}

		self.enviarOferta = function(destinatario) {
			self.videoChat().enviarOferta(destinatario);
			self.chat().llamada(destinatario);
		}
		
		self.aceptarLlamada = function(destinatario) {
			self.videoChat().aceptarLlamada(destinatario);
			self.chat().quitarLlamadaEntrante(destinatario);
		}
		
		self.disconnected = function() {
			self.chat().close();
		};

		self.transitionCompleted = function() {
			// Implement if needed
		};
		
		self.rechazarLlamada = function(destinatario){
			self.videoChat().rechazarLlamada(destinatario);
			self.chat().quitarLlamadaEntrante(destinatario);
		}
	}

	return ChatViewModel;
}
);
