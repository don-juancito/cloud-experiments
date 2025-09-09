# frozen_string_literal: true

require 'sinatra'

set :port, 4567
set :bind, '0.0.0.0'

get '/' do
  @container_hostname = ENV['HOSTNAME']
  erb :index
end