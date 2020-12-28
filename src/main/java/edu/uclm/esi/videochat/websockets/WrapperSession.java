package edu.uclm.esi.videochat.websockets;

import org.springframework.web.socket.WebSocketSession;

import edu.uclm.esi.videochat.model.User;

public class WrapperSession {

	private WebSocketSession session;
	private User user;

	public WrapperSession(WebSocketSession session, User user) {
		this.session = session;
		this.user = user;
	}

	public WebSocketSession getSession() {
		return this.session;
	}

	public User getUser() {
		return this.user;
	}
	
}
