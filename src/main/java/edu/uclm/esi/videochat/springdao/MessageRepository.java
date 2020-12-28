package edu.uclm.esi.videochat.springdao;

import org.springframework.data.repository.CrudRepository;

import edu.uclm.esi.videochat.model.Message;

public interface MessageRepository extends CrudRepository <Message, String> {

}
