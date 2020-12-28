package edu.uclm.esi.videochat.websockets;

import java.io.IOException;

import org.json.JSONObject;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

public class VideoRoom {

	private WebSocketSession a;
	private WebSocketSession b;
	private long acceptTime;
	private JSONObject info;

	public VideoRoom(WebSocketSession a, WebSocketSession b) {
		this.a = a;
		this.b = b;
	}

	public void accept() {
		this.acceptTime = System.currentTimeMillis();
	}

	public void setInfo(JSONObject info) {
		this.info = info;
	}
	
	public WebSocketSession getA() {
		return a;
	}

	public WebSocketSession getB() {
		return b;
	}
	
	public void broadcastString(String message) throws IOException {
		WebSocketMessage<?> textMessage=new TextMessage(message);
		if (this.a!=null)
			this.a.sendMessage(textMessage);
		if (this.b!=null)
			this.b.sendMessage(textMessage);
	}

	public void broadcast(Object... typesAndValues) throws IOException {
		JSONObject jso = new JSONObject();
		int i=0;
		while (i<typesAndValues.length) {
			jso.put(typesAndValues[i].toString(), typesAndValues[i+1]);
			i+=2;
		}
		WebSocketMessage<?> textMessage=new TextMessage(jso.toString());
		if (this.a!=null)
			this.a.sendMessage(textMessage);
		if (this.b!=null)
			this.b.sendMessage(textMessage);
	}

	public void setB(WebSocketSession b) {
		this.b = b;
	}
}
