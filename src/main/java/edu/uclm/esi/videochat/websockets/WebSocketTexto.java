package edu.uclm.esi.videochat.websockets;

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
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		JSONObject jso = new JSONObject(message.getPayload());
		String type = jso.getString("type");
		
		String enviador = getUser(session).getName();
		
		if (type.equals("BROADCAST")) {
			JSONObject jsoMessage = new JSONObject();
			jsoMessage.put("type", "FOR ALL");
			jsoMessage.put("time", formatDate(System.currentTimeMillis()));
			jsoMessage.put("message", jso.getString("message"));
			broadcast(jsoMessage);
			Message mensaje = new Message();
			mensaje.setMessage(jso.getString("texto"));
			mensaje.setSender(enviador);
			guardarMensaje(mensaje);
		} else if (type.equals("PARTICULAR")) {
			String destinatario = jso.getString("destinatario");
			User user = Manager.get().findUser(destinatario);
			WebSocketSession navegadorDelDestinatario = user.getSession();
			
			JSONObject jsoMessage = new JSONObject();
			jsoMessage.put("time", formatDate(System.currentTimeMillis()));
			jsoMessage.put("message", jso.get("texto"));
			
			this.send(navegadorDelDestinatario, "type", "PARTICULAR", "remitente", enviador, "message", jsoMessage);
			Message mensaje = new Message();
			mensaje.setMessage(jso.getString("texto"));
			mensaje.setSender(enviador);
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
