package edu.uclm.esi.videochat.springdao;

import java.util.ArrayList;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import edu.uclm.esi.videochat.model.Message;

public interface MessageRepository extends CrudRepository <Message, String> {

	@Query(value = "SELECT * FROM message where (sender=:sender and recipient=:recipient) OR (sender=:recipient and recipient=:sender) ORDER BY date", nativeQuery = true)
	public ArrayList<Message> recuperarMensajes(@Param("sender") String sender,@Param("recipient") String recipient);

	
}
