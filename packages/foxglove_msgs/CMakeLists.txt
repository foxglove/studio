cmake_minimum_required(VERSION 3.0.2)
project(foxglove_msgs)

find_package(catkin REQUIRED COMPONENTS geometry_msgs message_generation std_msgs visualization_msgs)

add_message_files(
  DIRECTORY msg
  FILES
  ImageMarkerArray.msg
)

generate_messages(DEPENDENCIES geometry_msgs std_msgs visualization_msgs)

catkin_package(CATKIN_DEPENDS geometry_msgs message_runtime std_msgs visualization_msgs)
