package com.cloudapp.socialforum;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;

public class DbConnectionTest {
    @Test
    public void testConnection() {
        // RDS 配置
        String url = "jdbc:mysql://social-forum-db-mysql.cbii4gykc5p0.ap-southeast-2.rds.amazonaws.com:3306/socialforum?useSSL=false&allowPublicKeyRetrieval=true";
        String user = "admin123";
        String password = "pxTUxZPBBmgk3XD"; // 之前配置文件里的密码

        System.out.println("\n===========================================");
        System.out.println("正在尝试连接数据库...");
        System.out.println("URL: " + url);
        System.out.println("User: " + user);
        
        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("✅ 连接成功! (Connection Successful)");
            System.out.println("Database Product: " + conn.getMetaData().getDatabaseProductName());
            conn.close();
        } catch (Exception e) {
            System.out.println("❌ 连接失败! (Connection Failed)");
            e.printStackTrace();
        }
        System.out.println("===========================================\n");
    }
}
