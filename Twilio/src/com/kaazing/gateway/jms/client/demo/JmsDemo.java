package com.kaazing.gateway.jms.client.demo;
 
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
 
import javax.jms.BytesMessage;
import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.ExceptionListener;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageConsumer;
import javax.jms.MessageListener;
import javax.jms.MessageProducer;
import javax.jms.Session;
import javax.jms.TextMessage;
import javax.jms.Topic;
import javax.naming.InitialContext;
import javax.naming.NamingException;

 
import com.twilio.sdk.TwilioRestClient;
import com.twilio.sdk.TwilioRestException;
import com.twilio.sdk.resource.instance.Account;
import com.twilio.sdk.resource.instance.Call;
import com.twilio.sdk.resource.factory.CallFactory;
import com.twilio.sdk.resource.factory.SmsFactory;
 
 
import com.kaazing.gateway.jms.client.stomp.StompConnectionFactory;
 
public class JmsDemo {
	// Twilio 
	public static final String ACCOUNT_SID = "YOUR_ACCOUNT_SID";
	public static final String AUTH_TOKEN = "YOUR_AUTH_TOKEN";
    public static void main(String[] args)
    throws NamingException, URISyntaxException, JMSException {
         
        Properties props = new Properties();
        props.put(InitialContext.INITIAL_CONTEXT_FACTORY,
        "com.kaazing.gateway.jms.client.stomp.StompInitialContextFactory");
        InitialContext ctx = new InitialContext(props);
         
        ConnectionFactory connectionFactory = (ConnectionFactory) ctx.lookup("ConnectionFactory");
        
        if ( connectionFactory instanceof StompConnectionFactory ) {
            ((StompConnectionFactory) connectionFactory)
            .setGatewayLocation(new URI("ws://localhost:8001/jms"));
        }         
       
        final Connection connection = connectionFactory.createConnection(null, null);
        connection.setExceptionListener(new ExceptionListener() {
            @Override
            public void onException(JMSException arg0) { arg0.printStackTrace(); }
        });         
       
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
         
        Topic topic = (Topic) ctx.lookup("/topic/twillio");
         
        MessageConsumer consumer = session.createConsumer(topic);
        consumer.setMessageListener(new MessageListener() {
            @Override
           
            public void onMessage(Message message) {
                try {
                	String msg = null;
                    msg = ((TextMessage) message).getText();                    
                    System.out.println("The received message: " + msg);
                    
                    //Twilio messaging                                      

                    TwilioRestClient client = new TwilioRestClient(ACCOUNT_SID, AUTH_TOKEN);
                    Account mainAccount = client.getAccount();
                    
                    SmsFactory smsFactory = mainAccount.getSmsFactory();
            		Map<String, String> smsParams = new HashMap<String, String>();
            		smsParams.put("To", msg); // Replace with a valid phone number
            		smsParams.put("From", "(415) 123-4567"); // Replace with a valid phone number in your account
            		smsParams.put("Body", "http://localhost:8001/tripzing");//Message body
            		smsFactory.create(smsParams);
                }
                catch (Exception e) { e.printStackTrace();
                }
            }
        });
        connection.start();
         
        try { Thread.sleep(2 * 1000); }
        catch (InterruptedException e) { e.printStackTrace(); }         
     
       
    }
}