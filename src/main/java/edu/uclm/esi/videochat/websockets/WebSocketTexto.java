package edu.uclm.esi.videochat.websockets;

import java.util.Date;

import org.json.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import edu.uclm.esi.videochat.model.Manager;
import edu.uclm.esi.videochat.model.Message;
import edu.uclm.esi.videochat.model.User;


@Component
public class WebSocketTexto extends WebSocketVideoChat {
	
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception{
		session.setBinaryMessageSizeLimit(1000*1024*1024);
		session.setTextMessageSizeLimit(64*1024);
		User user = getUser(session);
		user.setSessionDeTexto(session);
		
		JSONObject mensaje = new JSONObject();
		mensaje.put("type", "ARRIVAL");
		mensaje.put("userName", user.getName());
		mensaje.put("picture", user.getPicture());
		
		this.broadcast(mensaje);
		
		WrapperSession wrapper = new WrapperSession(session, user);
		this.sessionsByUserName.put(user.getName(), wrapper);
		this.sessionsById.put(session.getId(), wrapper);
		
		System.out.println(user.getName() + "--> Sesión de texto" + session.getId());
	}
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		JSONObject jso = new JSONObject(message.getPayload());
		String type = jso.getString("type");
		
		String enviador = getUser(session).getName();
		
		if (type.equals("BROADCAST")) {
			JSONObject jsoMessage = new JSONObject();
			jsoMessage.put("type", "FOR ALL");
			jsoMessage.put("time", formatDate(System.currentTimeMillis()));
			System.out.println(jso.getString("message"));
			jsoMessage.put("message", jso.getString("message"));
			broadcast(jsoMessage);
			Message mensaje = new Message();
			mensaje.setMessage(jso.getString("message"));
			mensaje.setSender(enviador);
			mensaje.setDate(System.currentTimeMillis());
			guardarMensaje(mensaje);
		} else if (type.equals("PARTICULAR")) {
			String destinatario = jso.getString("destinatario");
			User user = Manager.get().findUser(destinatario);
			WebSocketSession navegadorDelDestinatario = user.getSessionDeTexto();
			
			JSONObject jsoMessage = new JSONObject();
			jsoMessage.put("time", formatDate(System.currentTimeMillis()));
			jsoMessage.put("message", jso.get("texto"));
			
			this.send(navegadorDelDestinatario, "type", "PARTICULAR", "remitente", enviador, "message", jsoMessage);
			Message mensaje = new Message();
			mensaje.setMessage(jso.getString("texto"));
			mensaje.setSender(enviador);
			mensaje.setRecipient(destinatario);
			mensaje.setDate(System.currentTimeMillis());
			guardarMensaje(mensaje);
			
		}
	}

	private void guardarMensaje(Message mensaje) {
		Manager.get().getMessageRepo().save(mensaje);	
	}

	@Override
	protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
		session.setBinaryMessageSizeLimit(1000*1024*1024);
		
		byte[] payload = message.getPayload().array();
		System.out.println("La sesión " + session.getId() + " manda un binario de " + payload.length + " bytes");
	}
}
