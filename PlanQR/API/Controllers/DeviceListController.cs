using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Domain;
using Persistence;

namespace API.Controllers
{
    [ApiController]
    [Route("api/devices")]
    public class DeviceListController : BaseApiController
    {
        private readonly DataContext _context;

        public DeviceListController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeviceList>>> GetDevices()
        {
            return await _context.DeviceLists.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DeviceList>> GetDevice(int id)
        {
            var device = await _context.DeviceLists.FindAsync(id);
            if (device == null)
                return NotFound();

            return device;
        }

        [HttpPost]
        public async Task<ActionResult<DeviceList>> CreateDevice([FromBody] CreateDeviceDto dto)
        {
            var urlSource = $"{dto.deviceName}_{dto.deviceClassroom.ToUpper()}";
            var base64Url = Convert.ToBase64String(Encoding.UTF8.GetBytes(urlSource));

            var device = new DeviceList
            {
                deviceName = dto.deviceName,
                deviceClassroom = dto.deviceClassroom.ToUpper(),
                deviceURL = base64Url
            };

            _context.DeviceLists.Add(device);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDevice), new { id = device.id }, device);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(int id, [FromBody] DeviceList updatedDevice)
        {
            if (id != updatedDevice.id)
                return BadRequest();

            _context.Entry(updatedDevice).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.DeviceLists.Any(e => e.id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var device = await _context.DeviceLists.FindAsync(id);
            if (device == null)
                return NotFound();

            _context.DeviceLists.Remove(device);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("validate")]
        public async Task<IActionResult> ValidateRoomAndSecretUrl([FromQuery] string room, [FromQuery] string secretUrl)
        {
            // 1. Check legacy DeviceLists table
            var device = await _context.DeviceLists
                .FirstOrDefaultAsync(d => d.deviceClassroom == room && d.deviceURL == secretUrl);

            if (device != null)
            {
                return Ok(new { message = "Urządzenie znalezione (legacy).", device });
            }

            // 2. Check new DeviceAssignments table
            var assignment = await _context.DeviceAssignments
                .Include(a => a.Room)
                .Include(a => a.Device)
                .FirstOrDefaultAsync(a => a.Room.Name == room && a.SecretKey == secretUrl);

            if (assignment != null)
            {
                return Ok(new { 
                    message = "Urządzenie znalezione.", 
                    device = new {
                        deviceName = $"{assignment.Device.Manufacturer} {assignment.Device.Model}",
                        deviceClassroom = assignment.Room.Name,
                        deviceURL = assignment.SecretKey
                    }
                });
            }

            return NotFound(new { message = "Nie znaleziono urządzenia z podanym room i secretUrl." });
        }
    }
}