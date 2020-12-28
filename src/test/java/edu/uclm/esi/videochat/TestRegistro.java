package edu.uclm.esi.videochat;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.io.File;
import java.io.FileOutputStream;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeUnit;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.Point;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.LocalFileDetector;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.annotation.Order;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import edu.uclm.esi.videochat.springdao.UserRepository;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
public class TestRegistro {
	private WebDriver chrome;
	int numeroDeUsuarios = 100;

	ArrayList<WebDriver> drivers = new ArrayList<>();
	
	@Autowired
	UserRepository usersRepo;
	
	@Before
	public void setUp() throws Exception {
		System.setProperty("webdriver.chrome.driver", "/Users/macariopolousaola/Downloads/chromedriver");
		System.setProperty("webdriver.gecko.driver", "/Users/macariopolousaola/Downloads/geckodriver");
				
		//cargarCaras();
	}

	private void cargarCaras() throws Exception {
		String outputFolder = System.getProperty("java.io.tmpdir");
		if (!outputFolder.endsWith("/"))
			outputFolder+="/";
		
		CloseableHttpClient client = HttpClients.createDefault();
		for (int i=1; i<=this.numeroDeUsuarios; i++) {
			System.out.println("Bajando foto " + i + "/" + numeroDeUsuarios);
			HttpGet get = new HttpGet("https://thispersondoesnotexist.com/image");
			CloseableHttpResponse response = client.execute(get);
			HttpEntity entity = response.getEntity();
			byte[] image = EntityUtils.toByteArray(entity);
			try(FileOutputStream fos = new  FileOutputStream(outputFolder + "cara" + i + ".jpeg")) {
				fos.write(image);
			}
		}
		client.close();
	}

	@After
	public void tearDown() {
		for (int i=0; i<drivers.size(); i++)
			drivers.get(i).close();
	}

	//@Test
	//@Order(1)
	public void registrar() {
		chrome = new ChromeDriver();
		
		chrome.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);
		chrome.get("https://localhost:7500/");
		chrome.manage().window().setSize(new Dimension(1161, 977));
		chrome.manage().window().setPosition(new Point(0, 0));

		try {
			chrome.findElement(By.id("details-button")).click();
			chrome.findElement(By.id("proceed-link")).click();
		} catch (NoSuchElementException e) {
			System.out.println(e);
		}
		
		String inputFolder = System.getProperty("java.io.tmpdir");
		if (!inputFolder.endsWith("/"))
			inputFolder+="/";

		String picturePath;
		String script = "window.scrollTo(0,1000)";
		JavascriptExecutor je = (JavascriptExecutor) chrome;
		
		for (int i=1; i<=numeroDeUsuarios; i++) {
			chrome.findElement(By.linkText("Crear cuenta")).click();
			
			
			WebElement cajaNombre = chrome.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/input[1]"));
			WebElement cajaEmail = chrome.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/input[2]"));
			WebElement cajaPwd1 = chrome.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/input[3]"));
			WebElement cajaPwd2 = chrome.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/input[4]"));
			RemoteWebElement inputFile = (RemoteWebElement) chrome.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/input[5]"));
			
			cajaNombre.sendKeys("a" + i);
			cajaEmail.sendKeys("a" + i + "@gmail.com");
			cajaPwd1.sendKeys("pepe");
			cajaPwd2.sendKeys("pepe");
			
			LocalFileDetector detector = new LocalFileDetector();
			picturePath = inputFolder + "cara" + i + ".jpeg";
			File file = detector.getLocalFile(picturePath);
			inputFile.setFileDetector(detector);
			inputFile.sendKeys(file.getAbsolutePath());
					
			je.executeScript(script);
			
			WebElement botonCrearCuenta = chrome.findElement(By.id("btnCrearCuenta"));
			botonCrearCuenta.click();
			
			new WebDriverWait(chrome, 60).ignoring(NoAlertPresentException.class)
	        	.until(ExpectedConditions.alertIsPresent());
			
			assertThat(chrome.switchTo().alert().getText(), is("Registrado correctamente"));
			chrome.switchTo().alert().accept();
		}		
		
		chrome.quit();
	}
	
	@Test
	@Order(2)
	public void login() {
		int usuarios = 9;
		SecureRandom dado = new SecureRandom();
		ArrayList<String> nombres = new ArrayList<>();
		
		for (int i=0; i<usuarios; i++) {
			int n = 1 + dado.nextInt(99);
			String nombre = "a" + n;
			if (nombres.contains(nombre))
				i=i-1;
			else
				nombres.add(nombre);
		}
		int filas = (int) Math.sqrt(usuarios);
		int columnas = filas;
		
		int ancho=1920/columnas, alto=1200/filas;
		int posX = 0, posY=0;
		
		for (int i=0; i<usuarios; i++) {
			ChromeOptions options = new ChromeOptions();
			options.setCapability("--use-fake-ui-for-media-stream", true);
			
			ChromeDriver driver = new ChromeDriver(options);
			driver.manage().window().setSize(new Dimension(ancho, alto));
			driver.manage().window().setPosition(new Point(posX, posY));
			driver.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);
			driver.get("https://localhost:7500");
			try {
				driver.findElement(By.id("details-button")).click();
				driver.findElement(By.id("proceed-link")).click();
			} catch (NoSuchElementException e) {
				System.out.println(e);
			}
			WebElement cajaNombre = driver.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/div[1]/div[1]/input"));
			WebElement cajaPwd = driver.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/div[1]/div[2]/input"));
			WebElement btnEntrar = driver.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div/div[1]/div[3]/button"));
			
			cajaNombre.clear();
			cajaPwd.clear();
			cajaNombre.sendKeys(nombres.get(i));
			cajaPwd.sendKeys("pepe");
			btnEntrar.click();
			drivers.add(driver);
			posX = posX + ancho;
			if ((i+1)%columnas==0) {
				posX = 0;
				posY = posY + alto + 1;
			}
		}
		
		WebDriver driverLlamador = drivers.get(0);
		
		// Vídeo local
		WebElement btn = driverLlamador.findElement(By.xpath("/html/body/div/oj-module/div[1]/div[2]/div/div/div[2]/button[1]"));
		btn.click();
		
		// Crear conexión
		btn = driverLlamador.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div[2]/button[2]"));
		btn.click();
		
		// Enviar oferta
		btn = driverLlamador.findElement(By.xpath("//*[@id=\"globalBody\"]/oj-module/div[1]/div[2]/div/div/div[3]/div[1]/div[1]/button"));
		btn.click();
		
		int llamado = dado.nextInt(usuarios);
		String nombreLlamado = nombres.get(llamado);
		boolean clickHecho = false;
		int scroll = 10;
		do {
			try {
				WebElement link = driverLlamador.findElement(By.partialLinkText(nombreLlamado));
				link.click();
				clickHecho = true;
			}  catch (Exception e) {
				scroll+=30;
				String script = "window.scrollTo(0," + scroll + ")";
				((JavascriptExecutor) driverLlamador).executeScript(script);
			}
		} while (!clickHecho);		
		
		WebDriver driverLlamado = null;
		for (int i=0; i<usuarios; i++) {
			if (nombres.get(i).equals(nombreLlamado)) {
				driverLlamado = drivers.get(i);
				break;
			}
		}
		System.out.println("Hola");

	}
}