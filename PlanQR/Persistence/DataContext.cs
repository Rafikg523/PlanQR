using Domain;
using Microsoft.EntityFrameworkCore;
namespace Persistence;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options) : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; }

    public DbSet<DeviceList> DeviceLists { get; set; }
    public DbSet<Device> Devices { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<DeviceAssignment> DeviceAssignments { get; set; }
    public DbSet<RegistrationRequest> RegistrationRequests { get; set; }

    public async Task AddChatAsync(Message message){
        
        await SaveChangesAsync();
    }
}