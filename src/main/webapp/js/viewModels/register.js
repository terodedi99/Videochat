define(['knockout', 'appController', 'ojs/ojmodule-element-utils', 'accUtils'],
		function(ko, app, moduleUtils, accUtils) {

	function ProfileViewModel() {
		var self = this;

		self.name = ko.observable("");
		self.email = ko.observable("");
		self.pwd1 = ko.observable("");
		self.pwd2 = ko.observable("");
		self.picture=ko.observable("");
		
		self.setPicture = function(widget, event) {
			var file = event.target.files[0];
			var reader = new FileReader();
			reader.onload = function () {
				self.picture ("data:image/png;base64,"+btoa(reader.result));
			}
			reader.readAsBinaryString(file);
		}
		self.register = function() {
			var info = {
				name : self.name(),
				email : self.email(),
				pwd1 : self.pwd1(),
				pwd2 : self.pwd2(),
				picture : self.picture()
			};
			var data = {
					data : JSON.stringify(info),
					url : "users/register",
					type : "put",
					contentType : 'application/json',
					success : function(response) {
						alert("Registrado correctamente");
						app.router.go( { path : "login" } ); // Me lleva a login
					},
					error : function(response) {
						alert("Error: " + response.responseJSON.error);
					}
			};
			$.ajax(data);    	  
		}

		// Header Config
		self.headerConfig = ko.observable({'view':[], 'viewModel':null});
		moduleUtils.createView({'viewPath':'views/header.html'}).then(function(view) {
			self.headerConfig({'view':view, 'viewModel': app.getHeaderModel()})
		})

		// Below are a set of the ViewModel methods invoked by the oj-module component.
		// Please reference the oj-module jsDoc for additional information.

		/**
		 * Optional ViewModel method invoked after the View is inserted into the
		 * document DOM.  The application can put logic that requires the DOM being
		 * attached here.
		 * This method might be called multiple times - after the View is created
		 * and inserted into the DOM and after the View is reconnected
		 * after being disconnected.
		 */
		self.connected = function() {
			accUtils.announce('Profile page loaded.');
			document.title = "Profile";
			// Implement further logic if needed
		};

		/**
		 * Optional ViewModel method invoked after the View is disconnected from the DOM.
		 */
		self.disconnected = function() {
			// Implement if needed
		};

		/**
		 * Optional ViewModel method invoked after transition to the new View is complete.
		 * That includes any possible animation between the old and the new View.
		 */
		self.transitionCompleted = function() {
			// Implement if needed
		};
	}

	/*
	 * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
	 * return a constructor for the ViewModel so that the ViewModel is constructed
	 * each time the view is displayed.
	 */
	return ProfileViewModel;
}
);
