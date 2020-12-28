package edu.uclm.esi.videochat.model;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;

public class PS {

	public static void main(String[] args) throws Exception {
		String url = "http://12345678901234567890123456789012@mcbro.es/api/products/?output_format=JSON";
		
		JSONObject jsoProductos = getJSON(url);
		System.out.println(jsoProductos);
		
		JSONArray jsaProducts = jsoProductos.getJSONArray("products");
		for (int i=0; i<jsaProducts.length(); i++) {
			JSONObject jsoProduct = jsaProducts.getJSONObject(i);
			int id = jsoProduct.getInt("id");
			
			url = "http://12345678901234567890123456789012@mcbro.es/api/products/" + id + "/?output_format=JSON";
			
			JSONObject jsoDetallesProducto = getJSON(url);
			System.out.println("\n\n------------");
			System.out.println(jsoDetallesProducto);
			System.out.println("------------\n\n");
		}
	}

	private static JSONObject getJSON(String url) throws Exception { 
		try(CloseableHttpClient httpClient = HttpClients.createDefault()) {
			HttpGet request = new HttpGet(url);
			CloseableHttpResponse response = httpClient.execute(request); 
			HttpEntity entity = response.getEntity();
			String result = EntityUtils.toString(entity);
			if (result.length()>0 && !result.equals("[]") && !result.equals("{}"))
				return new JSONObject(result); 
			return null;
		}
	}
}
