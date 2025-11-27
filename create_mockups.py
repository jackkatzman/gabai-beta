#!/usr/bin/env python3
"""
Create Google Play device mockups by adding Pixel-style frames around screenshots.
No AI/DALL-E used - just simple device frame overlays.
"""

from PIL import Image, ImageDraw, ImageFilter
import os

def create_pixel_frame(screenshot_path, output_path, device_type="phone"):
    """
    Create a device mockup by placing a screenshot inside a Pixel-style frame.
    
    Args:
        screenshot_path: Path to the screenshot image
        output_path: Path for the output mockup
        device_type: "phone" for Pixel phone, "tablet" for tablet
    """
    screenshot = Image.open(screenshot_path)
    screenshot = screenshot.convert("RGBA")
    
    if device_type == "phone":
        device_width = 440
        device_height = 900
        corner_radius = 45
        bezel = 12
        screen_top_offset = 35
        screen_bottom_offset = 35
        frame_color = (30, 30, 30, 255)
        button_height = 4
    else:
        device_width = 900
        device_height = 600
        corner_radius = 30
        bezel = 15
        screen_top_offset = 20
        screen_bottom_offset = 20
        frame_color = (30, 30, 30, 255)
        button_height = 0
    
    screen_width = device_width - (bezel * 2)
    screen_height = device_height - screen_top_offset - screen_bottom_offset
    
    screenshot_resized = screenshot.resize((screen_width, screen_height), Image.Resampling.LANCZOS)
    
    canvas_width = device_width + 80
    canvas_height = device_height + 80
    canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 255))
    
    shadow = Image.new("RGBA", (device_width + 30, device_height + 30), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [0, 0, device_width + 29, device_height + 29],
        radius=corner_radius + 5,
        fill=(0, 0, 0, 80)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
    
    shadow_x = (canvas_width - shadow.width) // 2 + 5
    shadow_y = (canvas_height - shadow.height) // 2 + 8
    canvas.paste(shadow, (shadow_x, shadow_y), shadow)
    
    device = Image.new("RGBA", (device_width, device_height), (0, 0, 0, 0))
    device_draw = ImageDraw.Draw(device)
    
    device_draw.rounded_rectangle(
        [0, 0, device_width - 1, device_height - 1],
        radius=corner_radius,
        fill=frame_color
    )
    
    inner_rect = [
        bezel, 
        screen_top_offset, 
        device_width - bezel - 1, 
        device_height - screen_bottom_offset - 1
    ]
    inner_radius = corner_radius - bezel
    if inner_radius < 0:
        inner_radius = 0
    device_draw.rounded_rectangle(inner_rect, radius=inner_radius, fill=(0, 0, 0, 255))
    
    device.paste(screenshot_resized, (bezel, screen_top_offset))
    
    if device_type == "phone":
        camera_x = device_width // 2
        camera_y = screen_top_offset // 2
        device_draw.ellipse(
            [camera_x - 6, camera_y - 6, camera_x + 6, camera_y + 6],
            fill=(50, 50, 50, 255)
        )
        device_draw.ellipse(
            [camera_x - 3, camera_y - 3, camera_x + 3, camera_y + 3],
            fill=(20, 20, 20, 255)
        )
    
    device_x = (canvas_width - device_width) // 2
    device_y = (canvas_height - device_height) // 2
    canvas.paste(device, (device_x, device_y), device)
    
    if device_type == "phone":
        final_height = 2208
        final_width = int(canvas_width * (final_height / canvas_height))
    else:
        final_height = 1242
        final_width = int(canvas_width * (final_height / canvas_height))
    
    final = canvas.resize((final_width, final_height), Image.Resampling.LANCZOS)
    
    final_rgb = Image.new("RGB", final.size, (255, 255, 255))
    final_rgb.paste(final, mask=final.split()[3] if final.mode == "RGBA" else None)
    final_rgb.save(output_path, "PNG", quality=95)
    print(f"Created: {output_path} ({final_width}x{final_height})")
    
    return final_rgb

def create_tablet_from_phone_screenshot(screenshot_path, output_path):
    """
    Create a tablet mockup from a phone screenshot by scaling and centering it.
    """
    screenshot = Image.open(screenshot_path)
    screenshot = screenshot.convert("RGBA")
    
    tablet_screen_w = 1200
    tablet_screen_h = 800
    
    screenshot_ratio = screenshot.width / screenshot.height
    
    if screenshot_ratio > tablet_screen_w / tablet_screen_h:
        new_width = tablet_screen_w
        new_height = int(tablet_screen_w / screenshot_ratio)
    else:
        new_height = tablet_screen_h
        new_width = int(tablet_screen_h * screenshot_ratio)
    
    scaled_screenshot = screenshot.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    screen_content = Image.new("RGBA", (tablet_screen_w, tablet_screen_h), (255, 255, 255, 255))
    x = (tablet_screen_w - new_width) // 2
    y = (tablet_screen_h - new_height) // 2
    screen_content.paste(scaled_screenshot, (x, y))
    
    device_width = tablet_screen_w + 60
    device_height = tablet_screen_h + 60
    corner_radius = 40
    bezel = 30
    
    canvas_width = device_width + 100
    canvas_height = device_height + 100
    canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 255))
    
    shadow = Image.new("RGBA", (device_width + 40, device_height + 40), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [0, 0, device_width + 39, device_height + 39],
        radius=corner_radius + 5,
        fill=(0, 0, 0, 60)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))
    shadow_x = (canvas_width - shadow.width) // 2 + 8
    shadow_y = (canvas_height - shadow.height) // 2 + 12
    canvas.paste(shadow, (shadow_x, shadow_y), shadow)
    
    device = Image.new("RGBA", (device_width, device_height), (0, 0, 0, 0))
    device_draw = ImageDraw.Draw(device)
    
    device_draw.rounded_rectangle(
        [0, 0, device_width - 1, device_height - 1],
        radius=corner_radius,
        fill=(30, 30, 30, 255)
    )
    
    device.paste(screen_content, (bezel, bezel))
    
    camera_x = bezel // 2
    camera_y = device_height // 2
    device_draw.ellipse(
        [camera_x - 5, camera_y - 5, camera_x + 5, camera_y + 5],
        fill=(50, 50, 50, 255)
    )
    
    device_x = (canvas_width - device_width) // 2
    device_y = (canvas_height - device_height) // 2
    canvas.paste(device, (device_x, device_y), device)
    
    final_width = 2048
    final_height = int(canvas_height * (final_width / canvas_width))
    
    final = canvas.resize((final_width, final_height), Image.Resampling.LANCZOS)
    
    final_rgb = Image.new("RGB", final.size, (255, 255, 255))
    final_rgb.paste(final, mask=final.split()[3] if final.mode == "RGBA" else None)
    final_rgb.save(output_path, "PNG", quality=95)
    print(f"Created tablet: {output_path} ({final_width}x{final_height})")
    
    return final_rgb


if __name__ == "__main__":
    screenshots = [
        "attached_assets/Screenshot_20251127_102527_GabAi_1764262020485.jpg",
        "attached_assets/Screenshot_20251127_103036_GabAi_1764262020468.jpg",
        "attached_assets/Screenshot_20251127_103110_GabAi_1764262020453.jpg",
        "attached_assets/Screenshot_20251127_103307_GabAi_1764262020435.jpg",
        "attached_assets/Screenshot_20251127_103511_GabAi_1764262020419.jpg",
        "attached_assets/Screenshot_20251127_103957_GabAi_1764262020402.jpg",
        "attached_assets/Screenshot_20251127_104607_GabAi_1764262020364.jpg",
    ]
    
    os.makedirs("mockups/phone", exist_ok=True)
    os.makedirs("mockups/tablet", exist_ok=True)
    
    feature_names = [
        "01_chat_voice",
        "02_smart_lists",
        "03_list_share",
        "04_reminders",
        "05_calendar",
        "06_contacts",
        "07_groups",
    ]
    
    print("=" * 50)
    print("Creating Phone Mockups (Pixel-style frames)")
    print("=" * 50)
    
    for i, screenshot_path in enumerate(screenshots):
        if os.path.exists(screenshot_path):
            output_path = f"mockups/phone/{feature_names[i]}.png"
            create_pixel_frame(screenshot_path, output_path, "phone")
        else:
            print(f"Warning: {screenshot_path} not found")
    
    print("\n" + "=" * 50)
    print("Creating Tablet Mockups")
    print("=" * 50)
    
    for i, screenshot_path in enumerate(screenshots):
        if os.path.exists(screenshot_path):
            output_path = f"mockups/tablet/{feature_names[i]}_tablet.png"
            create_tablet_from_phone_screenshot(screenshot_path, output_path)
        else:
            print(f"Warning: {screenshot_path} not found")
    
    print("\n" + "=" * 50)
    print("DONE! Mockups created in:")
    print("  - mockups/phone/  (7 phone mockups)")
    print("  - mockups/tablet/ (7 tablet mockups)")
    print("=" * 50)
