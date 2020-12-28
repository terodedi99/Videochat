package edu.uclm.esi.videochat.websockets;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpSession;

import org.json.JSONObject;
import org.springframework.http.HttpHeaders;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import edu.uclm.esi.videochat.model.Manager;
import edu.uclm.esi.videochat.model.User;

public abstract class WebSocketVideoChat extends TextWebSocketHandler {
	protected ConcurrentHashMap<String, WrapperSession> sessionsByUserName = new ConcurrentHashMap<>();
	protected ConcurrentHashMap<String, WrapperSession> sessionsById = new ConcurrentHashMap<>();
	
	protected SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy, HH:mm:ss");
	 
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		session.setBinaryMessageSizeLimit(1000*1024*1024);
		session.setTextMessageSizeLimit(64*1024);
		
		User user = getUser(session);
		user.setSession(session);

		JSONObject mensaje = new JSONObject();
		mensaje.put("type", "ARRIVAL");
		mensaje.put("userName", user.getName());
		mensaje.put("picture", user.getPicture());
		
		this.broadcast(mensaje);
		
		WrapperSession wrapper = new WrapperSession(session, user);
		this.sessionsByUserName.put(user.getName(), wrapper);
		this.sessionsById.put(session.getId(), wrapper);
	}
	
	protected String formatDate(long millis) {
		return sdf.format(new Date(millis));
	}

	protected User getUser(WebSocketSession session) {
		HttpHeaders headers = session.getHandshakeHeaders();
		List<String> cookies = headers.get("cookie");
		for (String cookie : cookies) {
			int posJSessionId = cookie.indexOf("JSESSIONID=");
			String sessionId = cookie.substring(posJSessionId + 11);
			HttpSession httpSession = Manager.get().getSession(sessionId);
			return (User) httpSession.getAttribute("user");
		}
		return null;
	}

	protected void broadcast(JSONObject jsoMessage) {
		TextMessage message = new TextMessage(jsoMessage.toString());
		Runnable r = new Runnable() {
			@Override
			public void run() {
				Collection<WrapperSession> wrappers = WebSocketVideoChat.this.sessionsById.values();
				for (WrapperSession wrapper : wrappers) {
					try {
						wrapper.getSession().sendMessage(message);
					} catch (IOException e) {
						System.err.println("//TODO : ");
					}
				}
			}
		};
		new Thread(r).start();
	}
	
	protected void broadcast(String... values) {
		JSONObject jsoMessage = new JSONObject();
		for (int i=0; i<values.length; i=i+2) {
			jsoMessage.put(values[i], values[i+1]);
		}
		TextMessage message = new TextMessage(jsoMessage.toString());
		Runnable r = new Runnable() {
			@Override
			public void run() {
				Collection<WrapperSession> wrappers = WebSocketVideoChat.this.sessionsById.values();
				for (WrapperSession wrapper : wrappers) {
					try {
						wrapper.getSession().sendMessage(message);
					} catch (IOException e) {
						remove(wrapper);
					}
				}
			}
		};
		new Thread(r).start();
	}
	
	private void remove(WrapperSession wrapper) {
		Manager.get().remove(wrapper.getUser());
		this.sessionsById.remove(wrapper.getSession().getId());
		this.sessionsByUserName.remove(wrapper.getUser().getName());
		this.broadcast("type", "BYE", "userName", wrapper.getUser().getName());
	}
	
	private void remove(WebSocketSession session) {
		WrapperSession wrapper = this.sessionsById.get(session.getId());
		this.remove(wrapper);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		WrapperSession wrapper = this.sessionsById.get(session.getId());
		if (wrapper!=null)
			this.remove(wrapper);
	}
	
	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		exception.printStackTrace();
	}
	
	protected void send(WebSocketSession session, Object... typesAndValues) {
		JSONObject jso = new JSONObject();
		int i=0;
		while (i<typesAndValues.length) {
			jso.put(typesAndValues[i].toString(), typesAndValues[i+1]);
			i+=2;
		}
		WebSocketMessage<?> wsMessage=new TextMessage(jso.toString());
		try {
			session.sendMessage(wsMessage);
		} catch (IOException e) {
			this.remove(session);
		}
	}
}
