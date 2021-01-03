package edu.uclm.esi.videochat.springdao;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import edu.uclm.esi.videochat.model.User;

public interface UserRepository extends CrudRepository <User, String> {

	@Query(value = "SELECT * FROM message where sender=:sender and recipient=:recipient", nativeQuery = true)
	public int recuperarMensajes(@Param("sender") String sender,@Param("recipient") String recipient);

		
	@Query(value = "SELECT count(*) FROM user where name=:name and pwd=:pwd", nativeQuery = true)
	public int checkPassword(@Param("name") String name,@Param("pwd") String pwd);

	
	public User findByNameAndPwd(String name, String pwd);
	public Optional<User> findByName(String name);
}
