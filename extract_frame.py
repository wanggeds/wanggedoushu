# 从宇航员视频提取一帧作为首页背景图
import os, subprocess, glob

d = 'D:/桌面/王哥斗数网页版'
video = 'D:/桌面/宇航员旋转2K.mp4'
output = d + '/bg1.jpg'

# 检查视频是否存在
if not os.path.exists(video):
    print("视频不存在:", video)
    exit(1)

# 尝试找 ffmpeg
ffmpeg = None
for p in ['ffmpeg.exe', 'ffmpeg']:
    r = subprocess.run(['where', p], capture_output=True, text=True, shell=True)
    if r.returncode == 0:
        ffmpeg = r.stdout.strip().split('\n')[0]
        break

if not ffmpeg:
    # 检查项目目录下的ffmpeg
    for f in glob.glob(d + '/**/ffmpeg.exe', recursive=True):
        ffmpeg = f
        break

if ffmpeg:
    print("使用:", ffmpeg)
    cmd = [ffmpeg, '-i', video, '-vframes', '1', '-ss', '00:05', '-q:v', '2', '-y', output]
    subprocess.run(cmd)
    if os.path.exists(output):
        print("提取成功:", output, round(os.path.getsize(output)/1024, 1), "KB")
    else:
        print("提取失败")
else:
    print("未找到ffmpeg，请手动截图")
    print("打开视频文件:", video)
