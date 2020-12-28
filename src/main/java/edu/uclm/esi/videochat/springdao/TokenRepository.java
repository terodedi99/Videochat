package edu.uclm.esi.videochat.springdao;

import org.springframework.data.repository.CrudRepository;

import edu.uclm.esi.videochat.model.Token;

public interface TokenRepository extends CrudRepository <Token, String> {

}
