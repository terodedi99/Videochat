package edu.uclm.esi.videochat.model;

import java.util.UUID;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class Token {
	@Id
	private String id;
	private String email;
	private long date;
	
	public Token() {
	}

	public Token(String email) {
		this.id = UUID.randomUUID().toString();
		this.email = email;
		this.date = System.currentTimeMillis();		
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public long getDate() {
		return date;
	}

	public void setDate(long date) {
		this.date = date;
	}

	
}
