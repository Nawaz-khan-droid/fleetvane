import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class CleanupUsers {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
        String user = "postgres.dazltmarinusghfugsux";
        String password = "Leo9NU3OaJJ7okim";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            // Because shipments have ON DELETE CASCADE or are handled by JPA, doing it directly in SQL 
            // might fail if shipments table doesn't have CASCADE configured in DDL. 
            // Let's delete shipments first for these users, then the users.
            
            // Delete shipments belonging to users we will delete
            String delShipments = "DELETE FROM shipments WHERE client_id IN (SELECT id FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com'))";
            try (PreparedStatement ps = conn.prepareStatement(delShipments)) {
                int count = ps.executeUpdate();
                System.out.println("Deleted " + count + " shipments.");
            }
            
            // Delete refresh_tokens
            String delTokens = "DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com'))";
            try (PreparedStatement ps = conn.prepareStatement(delTokens)) {
                int count = ps.executeUpdate();
                System.out.println("Deleted " + count + " tokens.");
            }
            
            // Delete users
            String delUsers = "DELETE FROM users WHERE email NOT IN ('admin@fleetvane.com', 'client@fleetvane.com')";
            try (PreparedStatement ps = conn.prepareStatement(delUsers)) {
                int count = ps.executeUpdate();
                System.out.println("Deleted " + count + " users.");
            }
            
            System.out.println("Cleanup successful.");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
